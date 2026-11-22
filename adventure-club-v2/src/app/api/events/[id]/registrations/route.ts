import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { createEventRegistrationWithCode } from "@/lib/event-registration-code";

type RouteContext = { params: Promise<{ id: string }> };

// Admin manually registering a student for a Campus Event — the same
// "bypass the registration window" override /api/registrations gives
// AddParticipantModal for treks, just on EventRegistration instead of
// Registration. Still blocked once teams are drawn, same as a normal
// self-registration, since there's no slot to put a late add into.
export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;
    const { userId, guest } = await req.json();

    if (!userId && !guest) {
      return NextResponse.json({ message: "userId or guest is required." }, { status: 400 });
    }

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    if (event.eventTeamsDrawnAt) {
      return NextResponse.json(
        { message: "Team allocation has already started for this event." },
        { status: 400 }
      );
    }

    const registeredCount = await prisma.eventRegistration.count({ where: { trekId: eventId } });

    if (registeredCount >= event.seats) {
      return NextResponse.json(
        { message: "This event has reached its participant limit." },
        { status: 400 }
      );
    }

    if (guest) {
      const guestName = String(guest.name || "").trim();
      const guestPhone = String(guest.phone || "").trim();
      const guestRollNo = String(guest.rollNo || "").trim();
      const guestDepartment = String(guest.department || "").trim();
      const guestYear = String(guest.year || "").trim();

      if (!guestName || !guestPhone || !guestRollNo || !guestDepartment || !guestYear) {
        return NextResponse.json(
          { message: "Name, phone, college ID, department and year are required." },
          { status: 400 }
        );
      }

      const registration = await createEventRegistrationWithCode({
        trekId: eventId,
        isGuest: true,
        guestName,
        guestPhone,
        guestCollege: guest.college ? String(guest.college).trim() : null,
        guestRollNo,
        guestDepartment,
        guestYear,
      });

      return NextResponse.json({ message: "Guest added.", registration });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const existing = await prisma.eventRegistration.findFirst({
      where: { trekId: eventId, userId },
    });

    if (existing) {
      return NextResponse.json({ message: "Already registered." }, { status: 400 });
    }

    const registration = await createEventRegistrationWithCode({
      trekId: eventId,
      userId,
    });

    return NextResponse.json({ message: "Participant added.", registration });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
