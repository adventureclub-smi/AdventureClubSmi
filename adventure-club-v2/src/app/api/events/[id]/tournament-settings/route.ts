import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

// Team size, tournament format, qualifier count and match cap are all
// decided once actual attendance is known, not at event creation — this is
// the one place that sets them, called from the Team Allocation tab.
export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;
    const { teamSize, eventFormat, qualifiersCount, matchesPerTeamCap } = await req.json();

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const format = eventFormat === "DIRECT_KNOCKOUT" ? "DIRECT_KNOCKOUT" : "LEAGUE_KNOCKOUT";

    // Fixtures are already built for whichever format was locked in — only
    // the qualifier count (used later, at bracket-generation time) can
    // still move after that.
    if (event.eventTeamsDrawnAt && format !== event.eventFormat) {
      return NextResponse.json(
        { message: "Can't change tournament format once teams are locked." },
        { status: 400 }
      );
    }

    const qualifiersCountNum = qualifiersCount ? Number(qualifiersCount) : null;

    if (format === "LEAGUE_KNOCKOUT" && qualifiersCountNum !== null && ![4, 6].includes(qualifiersCountNum)) {
      return NextResponse.json(
        { message: "Qualifier count must be 4 or 6." },
        { status: 400 }
      );
    }

    const matchesPerTeamCapNum = matchesPerTeamCap ? Number(matchesPerTeamCap) : null;

    const updated = await prisma.trek.update({
      where: { id: eventId },
      data: {
        eventTeamSize: teamSize ? Number(teamSize) : null,
        eventFormat: format,
        eventQualifiersCount: format === "LEAGUE_KNOCKOUT" ? qualifiersCountNum : null,
        eventMatchesPerTeamCap: format === "LEAGUE_KNOCKOUT" ? matchesPerTeamCapNum : null,
      },
    });

    return NextResponse.json({ message: "Tournament settings saved.", event: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
