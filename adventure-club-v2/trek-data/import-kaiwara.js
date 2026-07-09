// One-off backfill script for the Kaiwara Betta Trek (2025-26 season archive).
// Run once with: node trek-data/import-kaiwara.js
// Requires the `xlsx` package installed (npm install xlsx --no-save) since it's
// only needed for this one-time import, not an ongoing app dependency.

const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SEASON = "2025-26";
const TREK_TITLE = "Kaiwara Betta Trek";
const TREK_DESTINATION = "Kaiwara Betta";
const TREK_DATE = new Date("2025-11-22T00:00:00.000Z");
const TREK_DIFFICULTY = "Easy";
const TREK_DURATION = "1 Day";

async function main() {
  const filePath = path.join(__dirname, "kaiwara for digital.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const peopleRows = rows.slice(1, 51); // SL 1..50 — row 51 onward is the summary block.

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
      price: 360 + 200,
      initialPayment: 360,
      finalPayment: 200,
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

    const [
      ,
      nameRaw,
      phoneRaw,
      rollRaw,
      emailRaw,
      yearRaw,
      courseRaw,
      courseFallbackRaw,
      ,
      initialRaw,
      formRaw,
      finalRaw,
      refundRaw,
    ] = row;

    const name = String(nameRaw || "").trim();
    if (!name) continue;

    const phone = phoneRaw ? String(phoneRaw).trim() : null;
    const roll = rollRaw ? String(rollRaw).trim() : null;
    const email = emailRaw ? String(emailRaw).trim() : null;
    const year = yearRaw ? String(yearRaw).trim() : null;
    const course = String(courseRaw || "").trim() || String(courseFallbackRaw || "").trim() || null;

    const initialPaid = initialRaw !== "" && initialRaw !== null && initialRaw !== undefined && !isNaN(Number(initialRaw));
    const initialAmount = initialPaid ? Number(initialRaw) || 0 : 0;

    const formSubmitted = String(formRaw).trim().toUpperCase() === "YES";

    const finalPaid = finalRaw !== "" && finalRaw !== null && finalRaw !== undefined && !isNaN(Number(finalRaw));
    const finalAmount = finalPaid ? Number(finalRaw) || 0 : 0;

    const refundGiven = refundRaw !== "" && refundRaw !== null && refundRaw !== undefined && !isNaN(Number(refundRaw));
    const refundAmount = refundGiven ? Number(refundRaw) || 0 : 0;

    // Attendance follows the same convention as the other historical
    // treks: only counted as attended if they actually paid the final
    // amount.
    const attended = finalPaid;

    const remarksParts = [`Roll No: ${roll || "N/A"}`, `Email: ${email || "N/A"}`];

    if (name === "Schwaas") {
      remarksParts.push("Sheet note: KALAI PERMIT");
    }

    const registration = await prisma.registration.create({
      data: {
        registrationNumber: `HIST-KAIWARA-${String(counter).padStart(2, "0")}`,
        trekId: trek.id,

        isGuest: true,
        guestName: name,
        guestInstitution: "SMI",
        guestDepartment: course,
        guestYear: year,
        guestPhoneNumber: phone,

        status: attended ? "COMPLETED" : "MISSED",

        remarks: remarksParts.join(" | "),

        initialPaymentPaid: initialPaid,
        initialPaymentPaidAt: initialPaid ? TREK_DATE : null,

        bondFormSubmitted: formSubmitted,
        bondFormSubmittedAt: formSubmitted ? TREK_DATE : null,

        attendanceMarked: attended,
        attendanceMarkedAt: attended ? TREK_DATE : null,

        finalPaymentUnlocked: true,
        finalPaymentPaid: finalPaid,
        finalPaymentPaidAt: finalPaid ? TREK_DATE : null,
      },
    });

    if (initialPaid) {
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
    }

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
        },
      });
    }

    created++;
  }

  // Trek-level income (college reimbursement) — bus and permits were
  // reimbursed in full by the college.
  await prisma.income.create({
    data: { trekId: trek.id, title: "Permits (college refund)", amount: 12600 },
  });
  await prisma.income.create({
    data: { trekId: trek.id, title: "Bus (college refund)", amount: 16230 },
  });

  // Trek-level expenses.
  const expenses = [
    { title: "Bus", amount: 16230 },
    { title: "Permits", amount: 12600 },
    { title: "Juice", amount: 350, remarks: "Paid personally by Supraj; not yet refunded by college." },
    { title: "Shovel", amount: 120, remarks: "Paid personally by Supraj; not yet refunded by college." },
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
