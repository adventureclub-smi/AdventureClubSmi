import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { buildEventPublicPayload } from "@/lib/event-public-payload";

// Powers the homepage's Live League section — finds whichever Campus Event
// the admin has featured (see /api/events/[id]/feature), which only ever
// happens once teams are drawn (that route's own check), and returns the
// same shape /api/events/[id]/public does once a tournament's started. Only
// one event is ever featured at a time (the feature route enforces that),
// so there's nothing to disambiguate here. No login required to read this —
// the whole point is that guests and on-spot sign-ups with no NAVIRA
// account can still see their team. `event: null` means "nothing to show"
// — the homepage section renders nothing rather than an empty state.
//
// Forced dynamic: the early "nothing featured" branch returns before ever
// calling getCurrentUser() (the only dynamic-API use in this file), so
// Next.js's build-time analysis can conclude this route never needs
// per-request data and cache that one response forever — exactly the bug
// this caused in production. See upcoming-event/route.ts for the sibling
// case.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await prisma.trek.findFirst({
      where: { type: "EVENT", eventFeaturedOnHomepage: true, eventTeamsDrawnAt: { not: null } },
    });

    if (!event) {
      return NextResponse.json({ event: null });
    }

    const user = await getCurrentUser();
    const payload = await buildEventPublicPayload(event, user);

    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
