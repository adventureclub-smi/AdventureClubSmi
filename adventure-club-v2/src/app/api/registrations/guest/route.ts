import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationStateForViewer } from "@/lib/registration-journey";
import { isYearEligible } from "@/lib/year-eligibility";
import { createRegistrationWithNumber } from "@/lib/registration-number";

// No login required — the whole point of this route. Only ever usable for
// workshops (checked below, not just hidden in the UI), since treks still
// require a real NAVIRA account for the liability/payment/trip-logistics
// side of things.
export async function POST(req: Request) {
  try {
    const {
      trekId,
      guestName,
      guestRollNo,
      guestPhoneNumber,
      guestInstitution,
      guestDepartment,
      guestCourse,
      guestYear,
    } = await req.json();

    if (
      !trekId ||
      !guestName?.trim() ||
      !guestRollNo?.trim() ||
      !guestPhoneNumber?.trim() ||
      !guestInstitution?.trim() ||
      !guestDepartment?.trim() ||
      !guestCourse?.trim() ||
      !guestYear?.trim()
    ) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const trek = await prisma.trek.findUnique({ where: { id: trekId } });

    if (!trek) {
      return NextResponse.json({ message: "Trek not found." }, { status: 404 });
    }

    if (trek.type !== "WORKSHOP") {
      return NextResponse.json(
        { message: "Guest registration is only available for workshops." },
        { status: 400 }
      );
    }

    // Guests are never core team, so this only ever reads the trek's normal
    // open/closed window — same check the authenticated route applies.
    const registrationState = registrationStateForViewer(trek, false);

    if (registrationState !== "OPEN") {
      return NextResponse.json(
        {
          message:
            registrationState === "NOT_OPEN"
              ? "Registrations haven't opened yet."
              : "Registrations for this workshop are closed.",
        },
        { status: 400 }
      );
    }

    if (!isYearEligible(guestYear, trek.restrictedYears)) {
      return NextResponse.json(
        {
          message: `This workshop is only open to ${trek.restrictedYears.join(", ")} students.`,
        },
        { status: 400 }
      );
    }

    // No stable identity for a guest besides the phone number they gave —
    // this is the closest equivalent to the authenticated route's
    // trekId+userId "already registered" check.
    const existing = await prisma.registration.findFirst({
      where: { trekId, isGuest: true, guestPhoneNumber: guestPhoneNumber.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { message: "You've already registered for this workshop with this phone number." },
        { status: 400 }
      );
    }

    const registration = await createRegistrationWithNumber({
      trekId,
      isGuest: true,
      guestName: guestName.trim(),
      guestRollNo: guestRollNo.trim(),
      guestPhoneNumber: guestPhoneNumber.trim(),
      guestInstitution: guestInstitution.trim(),
      guestDepartment: guestDepartment.trim(),
      guestCourse: guestCourse.trim(),
      guestYear: guestYear.trim(),
    });

    return NextResponse.json({
      message: "Registration successful!",
      registration,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
