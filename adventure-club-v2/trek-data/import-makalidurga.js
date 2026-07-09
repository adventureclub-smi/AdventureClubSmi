// One-off backfill script for the Makalidurga Trek (2025-26 season archive).
// Run once with: node trek-data/import-makalidurga.js
// Requires the `xlsx` package installed (npm install xlsx --no-save) since it's
// only needed for this one-time import, not an ongoing app dependency.

const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SEASON = "2025-26";
const TREK_TITLE = "Makalidurga Trek";
const TREK_DESTINATION = "Makalidurga";
const TREK_DATE = new Date("2025-10-11T00:00:00.000Z");
const TREK_DIFFICULTY = "Moderate";
const TREK_DURATION = "1 Day";

const SUPRAJ_PHONE = "9632227797";

// Remarks that are actually a proxy person's name (who physically received
// the refund), not a genuine free-text note.
const PROXY_REFUND_NAMES = {
  "Heeya Parikh": "Meghavi Parikh",
  "Samaavrutha ": "Anitha",
  "Pranati S": "Srikrishna Prashant",
};

function pick(a, b) {
  if (a === "" || a === undefined || a === null) return b;
  if (b === "" || b === undefined || b === null) return a;
  return b; // both non-blank and equal (or a real conflict) — prefer later row
}

async function main() {
  const filePath = path.join(__dirname, "makalidurga for digital.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const rawRows = rows.slice(1, 66); // SL rows — row 66 onward is the summary block.

  // Merge duplicate rows (same phone appears twice for ~10 people) — take
  // whichever row has a value per field, so an earlier "Form: YES" isn't
  // lost just because a later row updated a different field.
  const byPhone = new Map();
  for (const row of rawRows) {
    const phone = String(row[2]).trim();
    if (!phone) continue;
    if (!byPhone.has(phone)) {
      byPhone.set(phone, row.slice());
    } else {
      const existing = byPhone.get(phone);
      byPhone.set(phone, existing.map((v, i) => pick(v, row[i])));
    }
  }

  const peopleRows = [...byPhone.values()].sort((a, b) =>
    String(a[1]).trim().localeCompare(String(b[1]).trim())
  );

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
      price: 550 + 220,
      initialPayment: 550,
      finalPayment: 220,
      seats: peopleRows.length,
      description: `Historical trek record imported from the ${SEASON} season archive.`,
      isHistorical: true,
      season: SEASON,
    },
  });

  console.log("Created trek:", trek.id, trek.title);

  let created = 0;
  let counter = 0;

  for (const row of peopleRows) {
    counter++;

    const [, nameRaw, phoneRaw, emailRaw, yearRaw, initialRaw, formRaw, finalRaw, noteCol, refundRaw] = row;

    const name = String(nameRaw || "").trim();
    if (!name) continue;

    const phone = phoneRaw ? String(phoneRaw).trim() : null;
    const email = emailRaw ? String(emailRaw).trim() : null;
    const year = yearRaw ? String(yearRaw).trim() : null;
    const isSupraj = phone === SUPRAJ_PHONE;

    const formSubmitted = String(formRaw).trim().toUpperCase() === "YES";
    const finalPaid = !isSupraj && finalRaw !== "" && finalRaw !== null && finalRaw !== undefined && !isNaN(Number(finalRaw));
    const finalAmount = finalPaid ? Number(finalRaw) || 0 : 0;
    const refundGiven = !isSupraj && refundRaw !== "" && refundRaw !== null && refundRaw !== undefined && !isNaN(Number(refundRaw));
    const refundAmount = refundGiven ? Number(refundRaw) || 0 : 0;
    const initialAmount = isSupraj ? 550 : Number(initialRaw) || 0;

    // Core team attended but skipped the final payment/refund — the
    // initial payment was still made normally (₹550), confirmed 2026-07-09.
    const attended = isSupraj ? true : finalPaid;

    const strayNote = row
      .slice(8)
      .filter((c) => typeof c === "string" && c.trim() !== "" && c.trim().toUpperCase() !== "TOTAL" && c.trim().toUpperCase() !== "YES")
      .join(" | ");

    const remarksParts = [`Email: ${email || "N/A"}`];
    if (isSupraj) {
      remarksParts.push("Core team member — paid initial (₹550), no final payment");
    } else if (PROXY_REFUND_NAMES[name]) {
      remarksParts.push(`Refund collected via: ${PROXY_REFUND_NAMES[name]}`);
    } else if (strayNote) {
      remarksParts.push(`Sheet note: ${strayNote}`);
    }

    const registration = await prisma.registration.create({
      data: {
        registrationNumber: `HIST-MAKALIDURGA-${String(counter).padStart(2, "0")}`,
        trekId: trek.id,

        isGuest: true,
        guestName: name,
        guestInstitution: "SMI",
        guestDepartment: null,
        guestYear: year,
        guestPhoneNumber: phone,

        status: attended ? "COMPLETED" : "MISSED",

        remarks: remarksParts.join(" | "),

        initialPaymentPaid: true,
        initialPaymentPaidAt: TREK_DATE,

        bondFormSubmitted: formSubmitted,
        bondFormSubmittedAt: formSubmitted ? TREK_DATE : null,

        attendanceMarked: attended,
        attendanceMarkedAt: attended ? TREK_DATE : null,

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
          processedBy: PROXY_REFUND_NAMES[name] ? `Handed via ${PROXY_REFUND_NAMES[name]}` : null,
        },
      });
    }

    created++;
  }

  // Trek-level income (college reimbursement) — bus and permits were
  // reimbursed in full by the college.
  await prisma.income.create({
    data: { trekId: trek.id, title: "Permits (college refund)", amount: 24250 },
  });
  await prisma.income.create({
    data: { trekId: trek.id, title: "Bus (college refund)", amount: 15300 },
  });

  // Trek-level expenses.
  const expenses = [
    { title: "Bus", amount: 15300 },
    { title: "Permits", amount: 24250 },
    { title: "Snacks", amount: 823, remarks: "Sheet listed as 114 + 709 across two rows, combined here." },
    { title: "Juice", amount: 350, remarks: "Paid personally by Supraj; not yet refunded by college." },
    { title: "Porter", amount: 390, remarks: "Paid personally by Supraj; not yet refunded by college." },
    { title: "Petrol", amount: 1800 },
  ];

  for (const e of expenses) {
    await prisma.expense.create({
      data: { trekId: trek.id, title: e.title, amount: e.amount, remarks: e.remarks || null },
    });
  }

  console.log(`Imported ${created} participants for trek ${trek.id}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
