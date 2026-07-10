// One-off backfill script for the two Skandagiri Trek dates (2025-26 season
// archive) — the club ran the same trek twice (7 Feb + 14 Feb 2026) due to
// demand, and both rosters live in one excel with side-by-side tables.
// Run once with: node trek-data/import-skandagiri.js
// Requires the `xlsx` package installed (npm install xlsx --no-save) since it's
// only needed for this one-time import, not an ongoing app dependency.

const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SEASON = "2025-26";
const NOMINAL_INITIAL = 850;
const NOMINAL_FINAL = 250;
const TREK_DIFFICULTY = "Hard";
const TREK_DURATION = "1 Day";

// Names that appear on BOTH the 7th and 14th rosters where one side is the
// real payment record and the other is a leftover bookkeeping artifact (the
// person only actually attended once) — skip creating a second, phantom
// registration for these on the listed date.
const SKIP_ON_7TH = new Set(["nithilan t e", "sai supraj s"]);
const SKIP_ON_14TH = new Set(["abhinandan r bharadwaj", "sachi patil", "kalai", "neeraja karthi", "sara t."]);

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

// Reads an initial/final payment cell. Blank => not paid. A pure number =>
// paid that amount. Non-numeric text (DONE, YES, ...) => paid, ₹0 (already
// settled, no itemized amount recorded). Mixed text with an embedded number
// (e.g. "250(cash)") => paid that amount, with the remaining text kept as a
// note.
function parsePaymentCell(raw) {
  if (raw === "" || raw === null || raw === undefined) {
    return { paid: false, amount: 0, note: null };
  }

  if (!isNaN(Number(raw))) {
    return { paid: true, amount: Number(raw), note: null };
  }

  const str = String(raw).trim();
  const match = str.match(/\d+/);

  if (match) {
    const note = str.replace(match[0], "").replace(/[()]/g, "").trim();
    return { paid: true, amount: Number(match[0]), note: note || null };
  }

  return { paid: true, amount: 0, note: null };
}

function parseRefundCell(raw) {
  if (raw === "" || raw === null || raw === undefined) return 0;
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
}

async function importRoster({ trekTitle, trekDate, rows, skipNames, registrationPrefix }) {
  const existing = await prisma.trek.findFirst({
    where: { title: trekTitle, season: SEASON, isHistorical: true },
  });

  if (existing) {
    const existingRegCount = await prisma.registration.count({ where: { trekId: existing.id } });

    if (existingRegCount > 0) {
      console.log(`${trekTitle} already has ${existingRegCount} registrations imported. Skipping.`);
      return;
    }
  }

  const importableRows = rows.filter((r) => r.name && !skipNames.has(norm(r.name)));

  const trekDay = trekDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  const trek =
    existing ||
    (await prisma.trek.create({
      data: {
        title: trekTitle,
        destination: "Skandagiri",
        trailType: "N/A",
        difficulty: TREK_DIFFICULTY,
        altitude: "N/A",
        duration: TREK_DURATION,
        distance: "N/A",
        trekDay,
        date: trekDate,
        price: NOMINAL_INITIAL + NOMINAL_FINAL,
        initialPayment: NOMINAL_INITIAL,
        finalPayment: NOMINAL_FINAL,
        seats: importableRows.length,
        description: `Historical trek record imported from the ${SEASON} season archive.`,
        isHistorical: true,
        season: SEASON,
      },
    }));

  console.log(existing ? "Reusing existing trek:" : "Created trek:", trek.id, trek.title);

  let created = 0;

  for (const r of importableRows) {
    const initial = parsePaymentCell(r.initialRaw);
    const final = parsePaymentCell(r.finalRaw);
    const refundAmount = parseRefundCell(r.refundRaw);

    // Same convention as the Kaiwara/Savandurga imports: attendance is only
    // counted as confirmed once the final installment is settled.
    const attended = final.paid;

    const remarksParts = [];
    if (r.formsRaw !== undefined) {
      remarksParts.push(`Forms: ${String(r.formsRaw).trim().toUpperCase() === "YES" ? "Submitted" : "Not recorded"}`);
    }
    if (r.upiRaw) {
      remarksParts.push(`Payment ref: ${String(r.upiRaw).trim()}`);
    }
    if (initial.note) remarksParts.push(`Initial payment note: ${initial.note}`);
    if (final.note) remarksParts.push(`Final payment note: ${final.note}`);

    const registration = await prisma.registration.create({
      data: {
        registrationNumber: `${registrationPrefix}-${String(r.sl).padStart(2, "0")}`,
        trekId: trek.id,

        isGuest: true,
        guestName: r.name,
        guestInstitution: "SMI",
        guestDepartment: r.year && r.year.toLowerCase() === "faculty" ? "Faculty" : null,
        guestYear: r.year || null,
        guestPhoneNumber: null,

        status: attended ? "COMPLETED" : "MISSED",

        remarks: remarksParts.length ? remarksParts.join(" | ") : null,

        initialPaymentPaid: initial.paid,
        initialPaymentPaidAt: initial.paid ? trekDate : null,

        bondFormSubmitted: r.formsRaw !== undefined && String(r.formsRaw).trim().toUpperCase() === "YES",
        bondFormSubmittedAt:
          r.formsRaw !== undefined && String(r.formsRaw).trim().toUpperCase() === "YES" ? trekDate : null,

        attendanceMarked: attended,
        attendanceMarkedAt: attended ? trekDate : null,

        finalPaymentUnlocked: true,
        finalPaymentPaid: final.paid,
        finalPaymentPaidAt: final.paid ? trekDate : null,
      },
    });

    if (initial.paid) {
      await prisma.payment.create({
        data: {
          registrationId: registration.id,
          type: "INITIAL",
          amount: initial.amount,
          status: "PAID",
          paidAt: trekDate,
          notes: `Imported from ${SEASON} historical archive.`,
        },
      });
    }

    if (final.paid) {
      await prisma.payment.create({
        data: {
          registrationId: registration.id,
          type: "FINAL",
          amount: final.amount,
          status: "PAID",
          paidAt: trekDate,
          notes: `Imported from ${SEASON} historical archive.`,
        },
      });
    }

    if (refundAmount > 0) {
      await prisma.refund.create({
        data: {
          registrationId: registration.id,
          amount: refundAmount,
          status: "COMPLETED",
          processedAt: trekDate,
        },
      });
    }

    created++;
  }

  console.log(`Imported ${created} participants for ${trek.title} (${trek.id}).`);
}

async function main() {
  const filePath = path.join(__dirname, "skandagiri 7th and 14th for digital.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const dataRows = rows.slice(3, 53); // covers Sl 1..47 (7th) and Sl 1..50 (14th)

  const seventhRows = dataRows
    .filter((r) => String(r[1] || "").trim())
    .map((r) => ({
      sl: r[0],
      name: String(r[1]).trim(),
      year: String(r[2] || "").trim(),
      formsRaw: r[3],
      initialRaw: r[4],
      finalRaw: r[5],
      refundRaw: r[6],
      upiRaw: r[7],
    }));

  const fourteenthRows = dataRows
    .filter((r) => String(r[10] || "").trim())
    .map((r) => ({
      sl: r[9],
      name: String(r[10]).trim(),
      year: String(r[11] || "").trim(),
      initialRaw: r[12],
      finalRaw: r[13],
      refundRaw: r[14],
    }));

  await importRoster({
    trekTitle: "Skandagiri Trek (7 Feb)",
    trekDate: new Date("2026-02-07T00:00:00.000Z"),
    rows: seventhRows,
    skipNames: SKIP_ON_7TH,
    registrationPrefix: "HIST-SKANDAGIRI-7FEB",
  });

  await importRoster({
    trekTitle: "Skandagiri Trek (14 Feb)",
    trekDate: new Date("2026-02-14T00:00:00.000Z"),
    rows: fourteenthRows,
    skipNames: SKIP_ON_14TH,
    registrationPrefix: "HIST-SKANDAGIRI-14FEB",
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
