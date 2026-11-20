import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { registrationStateForViewer } from "@/lib/registration-journey";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { createEventRegistrationWithCode } from "@/lib/event-registration-code";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];

export async function POST(req: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Please login first." }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ message: "Invalid session." }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const { gender, buddyClubId } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const registrationState = registrationStateForViewer(event, isCoreTeamRole(user.clubRole));

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

    if (event.eventTeamsDrawnAt) {
      return NextResponse.json(
        { message: "Teams have already been drawn for this event." },
        { status: 400 }
      );
    }

    const existing = await prisma.eventRegistration.findFirst({
      where: { trekId: eventId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json({ message: "Already registered." }, { status: 400 });
    }

    const registeredCount = await prisma.eventRegistration.count({ where: { trekId: eventId } });

    if (registeredCount >= event.seats) {
      return NextResponse.json(
        { message: "This event has reached its participant limit." },
        { status: 400 }
      );
    }

    if (gender && !VALID_GENDERS.includes(gender)) {
      return NextResponse.json({ message: "Invalid gender value." }, { status: 400 });
    }

    let buddyRequestUserId: string | null = null;

    if (buddyClubId) {
      const buddy = await prisma.user.findUnique({ where: { clubId: buddyClubId } });

      if (!buddy) {
        return NextResponse.json(
          { message: "No student found with that Club ID." },
          { status: 400 }
        );
      }

      if (buddy.id === user.id) {
        return NextResponse.json(
          { message: "You can't buddy-pair with yourself." },
          { status: 400 }
        );
      }

      buddyRequestUserId = buddy.id;
    }

    const registration = await createEventRegistrationWithCode({
      trekId: eventId,
      userId: user.id,
      gender: gender || null,
      buddyRequestUserId,
    });

    return NextResponse.json({ message: "Registration successful!", registration });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
