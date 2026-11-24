import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Powers the homepage's pre-tournament countdown (UpcomingEventCountdown) —
// the "before" state that leads into the Live League section once an admin
// starts and features the tournament (see /api/homepage/featured-event).
// Finds whichever Campus Event is soonest to start that hasn't started yet,
// draft/test events excluded same as every other public listing. `event:
// null` means there's nothing to count down to, and the section renders
// nothing in that case rather than an empty state.
export async function GET() {
  try {
    const event = await prisma.trek.findFirst({
      where: {
        type: "EVENT",
        isDraft: false,
        isTest: false,
        eventTournamentStarted: { not: true },
        eventStartsAt: { not: null },
      },
      orderBy: { eventStartsAt: "asc" },
      select: { id: true, title: true, destination: true, eventStartsAt: true },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
