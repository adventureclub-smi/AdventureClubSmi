// One-off backfill script for the Vadatahosahalli Trek (2025-26 season archive).
// Run once with: node trek-data/import-vadatahosahalli.js
// Requires the `xlsx` package installed (npm install xlsx --no-save) since it's
// only needed for this one-time import, not an ongoing app dependency.

const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SEASON = "2025-26";
const TREK_TITLE = "Vadatahosahalli Trek";
const TREK_DESTINATION = "Vadatahosahalli";
const TREK_DATE = new Date("2025-09-14T00:00:00.000Z");
const TREK_DIFFICULTY = "Easy";
const TREK_DURATION = "1 Day";

const NOMINAL_INITIAL = 200;
const NOMINAL_FINAL = 230;

// SL numbers whose remark is a proxy person who physically received the
// refund on the participant's behalf, not a separate registration.
const PROXY_REFUND_NAMES = {
  20: "Aryaman",
  26: "Savita Vishwakarma",
  38: "Ramya",
  43: "Shipra",
};

// SL numbers confirmed as not attending — no final payment on record and
// no refund given.
const NOT_ATTENDED_NO_FINAL = new Set([29, 40, 42, 49]);

// Attended, paid in full, but couldn't make it on the day.
const NO_SHOW_SL = 35;

async function main() {
  const filePath = path.join(__dirname, "Vadatahosahalli for digital.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const peopleRows = rows.slice(1, 52); // SL 1..51 — row 52 ("shashvat") is a stray totals-row artifact, skipped.

  const existing = await prisma.trek.findFirst({
    where: { title: TREK_TITLE, season: SEASON, isHistorical: true },
  });

  if (existing) {
    console.log("Trek already imported (id: " + existing.id + "). Aborting to avoid duplicates.");
    return;
  }

  const trekDay = TREK_DATE.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  const trek = await prisma.trek.create({
    data: {
      title: TREK_TITLE,
      destination: TREK_DESTINATION,
      trailType: "N/A",
      difficulty: TREK_DIFFICULTY,
      altitude: "N/A",
      duration: TREK_DURATION,
      distance: "N/A",
      trekDay,
      date: TREK_DATE,
      price: NOMINAL_INITIAL + NOMINAL_FINAL,
      initialPayment: NOMINAL_INITIAL,
      finalPayment: NOMINAL_FINAL,
      seats: peopleRows.length,
      description: `Historical trek record imported from the ${SEASON} season archive.`,
      isHistorical: true,
      season: SEASON,
    },
  });

  console.log("Created trek:", trek.id, trek.title);

  let created = 0;

  for (const row of peopleRows) {
    const [slRaw, nameRaw, phoneRaw, rollRaw, yearRaw, initialRaw, formRaw, finalRaw, remarkCol, refundRaw] = row;

    const sl = Number(slRaw);
    const name = String(nameRaw || "").trim();
    if (!name) continue;

    const phone = phoneRaw ? String(phoneRaw).trim() : null;
    const roll = rollRaw ? String(rollRaw).trim() : null;
    const year = yearRaw ? String(yearRaw).trim() : null;

    const initialAmount = Number(initialRaw) || 0;
    const formSubmitted = String(formRaw).trim().toUpperCase() === "YES";
    const finalPaid = finalRaw !== "" && finalRaw !== null && finalRaw !== undefined;
    const finalAmount = finalPaid ? Number(finalRaw) || 0 : 0;
    const refundGiven = refundRaw !== "" && refundRaw !== null && refundRaw !== undefined;
    const refundAmount = refundGiven ? Number(refundRaw) || 0 : 0;

    // Stray free-text note that landed in/after the remarks column, minus the
    // "TOTAL" label artifact from row 52 bleeding into column checks.
    const strayNote = row
      .slice(8)
      .filter((c) => typeof c === "string" && c.trim() !== "" && c.trim() !== "TOTAL")
      .join(" | ");

    const notAttended = NOT_ATTENDED_NO_FINAL.has(sl) || sl === NO_SHOW_SL;

    const remarksParts = [`Roll No: ${roll || "N/A"}`];
    if (PROXY_REFUND_NAMES[sl]) {
      remarksParts.push(`Refund collected via: ${PROXY_REFUND_NAMES[sl]}`);
    } else if (strayNote) {
      remarksParts.push(`Sheet note: ${strayNote}`);
    }

    const registration = await prisma.registration.create({
      data: {
        registrationNumber: `HIST-VADATAHOSAHALLI-${String(sl).padStart(2, "0")}`,
        trekId: trek.id,

        isGuest: true,
        guestName: name,
        guestInstitution: "SMI",
        guestDepartment: null,
        guestYear: year,
        guestPhoneNumber: phone,

        status: notAttended ? "MISSED" : "COMPLETED",

        remarks: remarksParts.join(" | "),

        initialPaymentPaid: true,
        initialPaymentPaidAt: TREK_DATE,

        bondFormSubmitted: formSubmitted,
        bondFormSubmittedAt: formSubmitted ? TREK_DATE : null,

        attendanceMarked: !notAttended,
        attendanceMarkedAt: !notAttended ? TREK_DATE : null,

        finalPaymentUnlocked: true,
        finalPaymentPaid: finalPaid,
        finalPaymentPaidAt: finalPaid ? TREK_DATE : null,
      },
    });

    await prisma.payment.create({
      data: {
        registrationId: registration.id,
        type: "INITIAL",
        amount: initialAmount,
        status: "PAID",
        paidAt: TREK_DATE,
        notes: `Imported from ${SEASON} historical archive.`,
      },
    });

    if (finalPaid) {
      await prisma.payment.create({
        data: {
          registrationId: registration.id,
          type: "FINAL",
          amount: finalAmount,
          status: "PAID",
          paidAt: TREK_DATE,
          notes: `Imported from ${SEASON} historical archive.`,
        },
      });
    }

    if (refundGiven) {
      await prisma.refund.create({
        data: {
          registrationId: registration.id,
          amount: refundAmount,
          status: "COMPLETED",
          processedAt: TREK_DATE,
          processedBy: PROXY_REFUND_NAMES[sl] ? `Handed via ${PROXY_REFUND_NAMES[sl]}` : null,
        },
      });
    }

    created++;
  }

  console.log(`Imported ${created} participants for trek ${trek.id}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
