import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Powers the homepage's pre-tournament countdown (UpcomingEventCountdown) —
// the "before" state that leads into the Live League section once an admin
// starts and features the tournament (see /api/homepage/featured-event).
// Finds whichever Campus Event is soonest to start that hasn't started yet,
// draft/test events excluded same as every other public listing. `event:
// null` means there's nothing to count down to, and the section renders
// nothing in that case rather than an empty state.
//
// Forced dynamic: this handler has a static path and reads no
// request-specific data, so without this Next.js treats it as safe to
// pre-render once at build time and cache that response forever — meaning
// an admin setting eventStartsAt afterward would never actually show up.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await prisma.trek.findFirst({
      where: {
        type: "EVENT",
        isDraft: false,
        isTest: false,
        // Not `{ not: true }` — eventTournamentStarted is never written at
        // all until an admin actually starts the tournament, so on every
        // event that hasn't started yet the field is genuinely *missing*
        // from the Mongo document, not `null`. Prisma's `not`/`equals`
        // filters don't treat a missing field as matching here; `isSet`
        // (Mongo-specific) is what actually catches that case, alongside
        // the (currently never-written, but defensively-handled) `false`.
        OR: [{ eventTournamentStarted: { isSet: false } }, { eventTournamentStarted: false }],
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
