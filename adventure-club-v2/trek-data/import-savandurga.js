// One-off backfill script for the Savandurga Trek (2025-26 season archive).
// Run once with: node trek-data/import-savandurga.js
// Requires the `xlsx` package installed (npm install xlsx --no-save) since it's
// only needed for this one-time import, not an ongoing app dependency.

const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SEASON = "2025-26";
const TREK_TITLE = "Savandurga Trek";
const TREK_DESTINATION = "Savandurga";
const TREK_DATE = new Date("2026-01-24T00:00:00.000Z");
const TREK_DIFFICULTY = "Moderate";
const TREK_DURATION = "1 Day";

const SAVANDURGA_ONLY_INITIAL = 450;
const SAVANDURGA_ONLY_FINAL = 200;

// People who also went on one of the Skandagiri trips paid a combined
// package (₹1450: 900 + 550) entirely at Skandagiri registration — nothing
// changed hands for Savandurga itself, so these get ₹0 Payment rows with a
// student-facing override instead of a real amount.
const COMBINED_PACKAGE_OVERRIDE = "Payment done in Skandagiri";
const COMBINED_PACKAGE_NOTE =
  "Combined package paid at Skandagiri trek registration — no separate Savandurga charge.";

async function main() {
  const filePath = path.join(__dirname, "SAVANDURGA for digital.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const peopleRows = rows.slice(2, 46); // SL 1..44 (row 0 is a title row, row 1 is the header row)

  let trek = await prisma.trek.findFirst({
    where: { title: TREK_TITLE, season: SEASON, isHistorical: true },
  });

  if (trek) {
    const existingRegCount = await prisma.registration.count({ where: { trekId: trek.id } });

    if (existingRegCount > 0) {
      console.log(
        `Trek already has ${existingRegCount} registrations imported (id: ${trek.id}). Aborting to avoid duplicates.`
      );
      return;
    }

    // Reuse the shell trek the admin UI already created (e.g. with real map
    // coordinates already set) rather than creating a duplicate — just fill
    // in the pricing/seat fields that were still at their zero defaults.
    trek = await prisma.trek.update({
      where: { id: trek.id },
      data: {
        price: SAVANDURGA_ONLY_INITIAL + SAVANDURGA_ONLY_FINAL,
        initialPayment: SAVANDURGA_ONLY_INITIAL,
        finalPayment: SAVANDURGA_ONLY_FINAL,
        seats: peopleRows.length,
      },
    });

    console.log("Reusing existing trek shell:", trek.id, trek.title);
  } else {
    const trekDay = TREK_DATE.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

    trek = await prisma.trek.create({
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
        price: SAVANDURGA_ONLY_INITIAL + SAVANDURGA_ONLY_FINAL,
        initialPayment: SAVANDURGA_ONLY_INITIAL,
        finalPayment: SAVANDURGA_ONLY_FINAL,
        seats: peopleRows.length,
        description: `Historical trek record imported from the ${SEASON} season archive.`,
        isHistorical: true,
        season: SEASON,
      },
    });

    console.log("Created trek:", trek.id, trek.title);
  }

  let created = 0;

  for (const row of peopleRows) {
    const [slRaw, nameRaw, phoneRaw, , bothRaw, initialRaw, finalRaw, rollRaw, emailRaw, yearRaw] = row;

    const sl = Number(slRaw);
    const name = String(nameRaw || "").trim();
    if (!name) continue;

    const phone = phoneRaw ? String(phoneRaw).trim() : null;
    const roll = rollRaw ? String(rollRaw).trim() : null;
    const email = emailRaw ? String(emailRaw).trim() : null;
    const year = yearRaw ? String(yearRaw).trim() : null;

    const isBoth = String(bothRaw).trim().toLowerCase() === "both";

    const initialPaid =
      !isBoth && initialRaw !== "" && initialRaw !== null && initialRaw !== undefined && !isNaN(Number(initialRaw));
    const initialAmount = initialPaid ? Number(initialRaw) || 0 : 0;

    const finalPaid =
      !isBoth && finalRaw !== "" && finalRaw !== null && finalRaw !== undefined && !isNaN(Number(finalRaw));
    const finalAmount = finalPaid ? Number(finalRaw) || 0 : 0;

    // Same convention as the Kaiwara import: attendance is only counted as
    // confirmed once the final installment is settled — "both" participants
    // settled theirs (combined package) at Skandagiri instead of here.
    const attended = isBoth || finalPaid;

    const remarksParts = [`Roll No: ${roll || "N/A"}`, `Email: ${email || "N/A"}`];
    if (isBoth) {
      remarksParts.push(
        "Attended both Savandurga & Skandagiri — paid the ₹1450 combined package at Skandagiri registration; no separate Savandurga payment."
      );
    }

    const registration = await prisma.registration.create({
      data: {
        registrationNumber: `HIST-SAVANDURGA-${String(sl).padStart(2, "0")}`,
        trekId: trek.id,

        isGuest: true,
        guestName: name,
        guestInstitution: "SMI",
        guestDepartment: null,
        guestYear: year,
        guestPhoneNumber: phone,

        status: attended ? "COMPLETED" : "MISSED",

        remarks: remarksParts.join(" | "),

        initialPaymentPaid: isBoth || initialPaid,
        initialPaymentPaidAt: isBoth || initialPaid ? TREK_DATE : null,

        attendanceMarked: attended,
        attendanceMarkedAt: attended ? TREK_DATE : null,

        finalPaymentUnlocked: true,
        finalPaymentPaid: isBoth || finalPaid,
        finalPaymentPaidAt: isBoth || finalPaid ? TREK_DATE : null,
      },
    });

    if (isBoth) {
      await prisma.payment.create({
        data: {
          registrationId: registration.id,
          type: "INITIAL",
          amount: 0,
          status: "PAID",
          paidAt: TREK_DATE,
          displayOverride: COMBINED_PACKAGE_OVERRIDE,
          notes: COMBINED_PACKAGE_NOTE,
        },
      });

      await prisma.payment.create({
        data: {
          registrationId: registration.id,
          type: "FINAL",
          amount: 0,
          status: "PAID",
          paidAt: TREK_DATE,
          displayOverride: COMBINED_PACKAGE_OVERRIDE,
          notes: COMBINED_PACKAGE_NOTE,
        },
      });
    } else {
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
