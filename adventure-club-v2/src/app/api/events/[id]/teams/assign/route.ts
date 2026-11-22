import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

// Records the team a participant physically drew from the chit bag —
// one click per person, never a bulk/automatic assignment. Passing
// teamId: null undoes a mistaken entry. Once the admin locks teams
// (see /lock-teams) this is no longer callable.
export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;
    const { registrationId, teamId } = await req.json();

    if (!registrationId) {
      return NextResponse.json({ message: "registrationId is required." }, { status: 400 });
    }

    const event = await prisma.trek.findUnique({ where: { id: eventId } });
    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    if (event.eventTeamsDrawnAt) {
      return NextResponse.json(
        { message: "Teams are locked — no more switching allowed." },
        { status: 400 }
      );
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!registration || registration.trekId !== eventId) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }

    if (teamId) {
      const team = await prisma.eventTeam.findUnique({ where: { id: teamId } });
      if (!team || team.trekId !== eventId) {
        return NextResponse.json({ message: "Team not found." }, { status: 404 });
      }
    }

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { teamId: teamId || null },
    });

    return NextResponse.json({ message: teamId ? "Allocation recorded." : "Allocation cleared.", registration: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
