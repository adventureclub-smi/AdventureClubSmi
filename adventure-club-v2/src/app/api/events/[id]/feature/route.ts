import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

// Toggles whether this event is the one shown in the homepage's Live League
// section (see /api/homepage/featured-event). Only one event is ever
// featured at a time — turning this on unfeatures whatever else was
// featured, rather than asking the admin to remember to turn the old one
// off first. Gated on the tournament having actually started, same as every
// other "this is now public" action for a Campus Event, since nothing about
// teams/fixtures is meant to be visible before that.
export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;
    const { featured } = await req.json();

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    if (featured && !event.eventTournamentStarted) {
      return NextResponse.json(
        { message: "Start the tournament (\"Close Registrations & Start Tournament\") before featuring it on the homepage." },
        { status: 400 }
      );
    }

    if (featured) {
      await prisma.trek.updateMany({
        where: { type: "EVENT", id: { not: eventId }, eventFeaturedOnHomepage: true },
        data: { eventFeaturedOnHomepage: false },
      });
    }

    await prisma.trek.update({
      where: { id: eventId },
      data: { eventFeaturedOnHomepage: !!featured },
    });

    return NextResponse.json({
      message: featured ? "Now featured on the homepage." : "Removed from the homepage.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
