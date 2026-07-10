// One-off backfill script for the Kaurava Kunda Sunset Trek (2025-26 season
// archive). Only the "Payments" sheet is used — a single flat ₹470 fee, no
// installments, no refunds for this trek.
// Run once with: node trek-data/import-kaurava-kunda.js
// Requires the `xlsx` package installed (npm install xlsx --no-save) since it's
// only needed for this one-time import, not an ongoing app dependency.

const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SEASON = "2025-26";
const TREK_TITLE = "Kaurava Kunda Sunset Trek";
const TREK_DESTINATION = "Kaurava Kunda";
const TREK_DATE = new Date("2026-04-18T00:00:00.000Z");
const TREK_DIFFICULTY = "Moderate";
const TREK_DURATION = "1 Day";
const FLAT_FEE = 470;

async function main() {
  const filePath = path.join(__dirname, "Kaurava Kunda 2026 SIGN UP's - Trekker List.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets["Payments"];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const peopleRows = rows.slice(1, 33); // SL 1..32 — row 33 is the totals row.

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
      // Single flat fee, no installment structure — the "final payment"
      // concept doesn't apply to this trek at all.
      price: FLAT_FEE,
      initialPayment: FLAT_FEE,
      finalPayment: 0,
      seats: peopleRows.length,
      description: `Historical trek record imported from the ${SEASON} season archive.`,
      isHistorical: true,
      season: SEASON,
    },
  });

  console.log("Created trek:", trek.id, trek.title);

  let created = 0;

  for (const row of peopleRows) {
    const [slRaw, nameRaw, yearRaw, phoneRaw, paymentRaw] = row;

    const sl = Number(slRaw);
    const name = String(nameRaw || "").trim();
    if (!name) continue;

    const year = String(yearRaw || "").trim() || null;
    const phone = phoneRaw ? String(phoneRaw).trim() : null;

    const paid = paymentRaw !== "" && paymentRaw !== null && paymentRaw !== undefined && !isNaN(Number(paymentRaw));
    const amount = paid ? Number(paymentRaw) || 0 : 0;

    // No installments and no separate attendance signal in this sheet —
    // for a single flat-fee trek, having paid is the only record of
    // participation we have.
    const attended = paid;

    const registration = await prisma.registration.create({
      data: {
        registrationNumber: `HIST-KAURAVAKUNDA-${String(sl).padStart(2, "0")}`,
        trekId: trek.id,

        isGuest: true,
        guestName: name,
        guestInstitution: "SMI",
        guestDepartment: null,
        guestYear: year,
        guestPhoneNumber: phone,

        status: attended ? "COMPLETED" : "MISSED",

        initialPaymentPaid: paid,
        initialPaymentPaidAt: paid ? TREK_DATE : null,

        attendanceMarked: attended,
        attendanceMarkedAt: attended ? TREK_DATE : null,

        // No final-payment step exists for this trek.
        finalPaymentUnlocked: false,
        finalPaymentPaid: false,
      },
    });

    if (paid) {
      await prisma.payment.create({
        data: {
          registrationId: registration.id,
          type: "INITIAL",
          amount,
          status: "PAID",
          paidAt: TREK_DATE,
          notes: `Imported from ${SEASON} historical archive.`,
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
