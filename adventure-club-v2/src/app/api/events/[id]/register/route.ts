import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { registrationStateForViewer } from "@/lib/registration-journey";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { createEventRegistrationWithCode } from "@/lib/event-registration-code";

type RouteContext = { params: Promise<{ id: string }> };

// Registration is always individual — no buddy/group sign-up, teams are
// never decided here (see Trek's Campus Events schema comment). Two paths:
// a logged-in club member registering themselves, or a guest (no club
// account — a walk-in, someone from another college, or anyone scanning the
// event's QR who isn't logged in) registering with just their name/phone.
export async function POST(req: Request, context: RouteContext) {
  try {
    const { id: eventId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const guest = body?.guest;

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const payload = token ? verifyToken(token) : null;
    const user = payload ? await prisma.user.findUnique({ where: { id: payload.id } }) : null;

    if (!guest && !user) {
      return NextResponse.json({ message: "Please login first." }, { status: 401 });
    }

    const registrationState = registrationStateForViewer(
      event,
      !!user && isCoreTeamRole(user.clubRole)
    );

    if (registrationState !== "OPEN") {
      return NextResponse.json(
        {
          message:
            registrationState === "NOT_OPEN"
              ? "Registrations haven't opened yet."
              : "Registrations for this event are closed.",
        },
        { status: 400 }
      );
    }

    if (event.eventTournamentStarted) {
      return NextResponse.json(
        { message: "The tournament has started — registration for this event is closed." },
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
        guestRollNo,
        guestDepartment,
        guestYear,
      });

      return NextResponse.json({ message: "Registration successful!", registration });
    }

    const existing = await prisma.eventRegistration.findFirst({
      where: { trekId: eventId, userId: user!.id },
    });

    if (existing) {
      return NextResponse.json({ message: "Already registered." }, { status: 400 });
    }

    const registration = await createEventRegistrationWithCode({
      trekId: eventId,
      userId: user!.id,
    });

    return NextResponse.json({ message: "Registration successful!", registration });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
