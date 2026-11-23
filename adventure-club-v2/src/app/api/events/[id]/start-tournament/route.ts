import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

// The one action that closes registration and makes the drawn teams,
// fixtures and standings visible on the public event page and the TV
// display — everything the admin does before this (drawing teams, playing
// with fixtures, recording test results) stays invisible to everyone else.
// Reversible, in case it's clicked by mistake or registration needs to stay
// open a little longer after all.
export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;
    const { started } = await req.json();

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const updated = await prisma.trek.update({
      where: { id: eventId },
      data: {
        eventTournamentStarted: !!started,
        registrationClosedManually: !!started,
      },
    });

    return NextResponse.json({
      message: started
        ? "Registrations closed — the tournament is now visible to everyone."
        : "Registrations reopened — the tournament is hidden from the public again.",
      event: updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
