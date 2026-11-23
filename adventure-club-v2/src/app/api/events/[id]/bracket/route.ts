import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { computeGroupStandings } from "@/lib/event-points-table";
import { seedInitialBracket, nextRoundPairs, roundNamesForBracketSize } from "@/lib/event-bracket";
import { seedPagePlayoff, nextPlayoffStep, PLAYOFF_ROUND_LABELS } from "@/lib/event-playoff";

type RouteContext = { params: Promise<{ id: string }> };

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

function seededTiebreak(teamId: string, seed: string): number {
  let hash = 0;
  const str = `${seed}:${teamId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// One "advance" action, re-used for every step — the admin UI just has a
// single button it keeps clicking. LEAGUE_KNOCKOUT plays a fixed 4-team
// page playoff (Qualifier/Eliminator/Qualifier 2/Final — see
// event-playoff.ts); DIRECT_KNOCKOUT plays the generic bracket in
// event-bracket.ts instead, seeded directly from every team at draw time.
export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const teams = await prisma.eventTeam.findMany({ where: { trekId: eventId } });
    const existingKnockout = await prisma.eventMatch.findMany({
      where: { trekId: eventId, stage: "KNOCKOUT" },
      orderBy: { id: "asc" },
    });

    if (event.eventFormat !== "DIRECT_KNOCKOUT") {
      return handlePagePlayoff(eventId, event, teams, existingKnockout);
    }

    if (existingKnockout.length === 0) {
      return NextResponse.json(
        { message: "Direct Knockout seeds its bracket when teams are drawn — nothing to generate here." },
        { status: 400 }
      );
    }

    const currentRoundName = existingKnockout[existingKnockout.length - 1].round!;
    const currentRoundMatches = existingKnockout.filter((m) => m.round === currentRoundName);

    const unplayed = currentRoundMatches.filter((m) => m.status !== "COMPLETED");
    if (unplayed.length > 0) {
      return NextResponse.json(
        { message: `${currentRoundName} isn't finished yet.` },
        { status: 400 }
      );
    }

    // Recover how many teams the bracket actually started with from the
    // first round's own rows — a match row held 2 of them, a bye row held
    // 1.
    const firstRoundName = existingKnockout[0].round!;
    const firstRoundRows = existingKnockout.filter((m) => m.round === firstRoundName);
    const startingTeamCount = firstRoundRows.reduce((sum, m) => sum + (m.teamBId ? 2 : 1), 0);
    const bracketSize = nextPowerOfTwo(startingTeamCount);
    const roundNames = roundNamesForBracketSize(bracketSize);
    const currentIndex = roundNames.indexOf(currentRoundName);

    if (currentIndex === -1) {
      return NextResponse.json({ message: "Unrecognised bracket round." }, { status: 500 });
    }

    if (currentIndex === roundNames.length - 1) {
      return NextResponse.json({ message: "The tournament is already complete." });
    }

    const nextRoundName = roundNames[currentIndex + 1];
    const winners = currentRoundMatches.map((m) => m.winnerTeamId!);
    const pairs = nextRoundPairs(winners);

    for (const pair of pairs) {
      await prisma.eventMatch.create({
        data: {
          trekId: eventId,
          stage: "KNOCKOUT",
          round: nextRoundName,
          teamAId: pair.teamAId,
          teamBId: pair.teamBId,
        },
      });
    }

    return NextResponse.json({ message: `${nextRoundName} generated.`, round: nextRoundName });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

async function handlePagePlayoff(
  eventId: string,
  event: { eventDrawSeed: string | null },
  teams: { id: string; name: string; colour: string }[],
  existingKnockout: {
    id: string;
    round: string | null;
    teamAId: string;
    teamBId: string | null;
    winnerTeamId: string | null;
    status: string;
  }[]
) {
  if (existingKnockout.length === 0) {
    const groupMatches = await prisma.eventMatch.findMany({
      where: { trekId: eventId, stage: "GROUP" },
    });

    const unplayed = groupMatches.filter((m) => m.status !== "COMPLETED");
    if (unplayed.length > 0) {
      return NextResponse.json({ message: "The league stage isn't finished yet." }, { status: 400 });
    }

    const [standings] = computeGroupStandings(
      teams.map((t) => ({ ...t, groupNumber: null })),
      groupMatches.map((m) => ({
        teamAId: m.teamAId,
        teamBId: m.teamBId ?? "",
        winnerTeamId: m.winnerTeamId,
        status: m.status,
        groupNumber: null,
      })),
      4,
      event.eventDrawSeed ?? ""
    );

    const qualifiers = standings.rows.filter((row) => row.qualified).map((row) => row.teamId);

    if (qualifiers.length < 4) {
      return NextResponse.json(
        { message: "Need at least 4 teams in the league table to start the playoff." },
        { status: 400 }
      );
    }

    const [qualifier, eliminator] = seedPagePlayoff(
      qualifiers.slice(0, 4) as [string, string, string, string]
    );

    await prisma.eventMatch.create({
      data: { trekId: eventId, stage: "KNOCKOUT", round: qualifier.round, teamAId: qualifier.teamAId, teamBId: qualifier.teamBId },
    });
    await prisma.eventMatch.create({
      data: { trekId: eventId, stage: "KNOCKOUT", round: eliminator.round, teamAId: eliminator.teamAId, teamBId: eliminator.teamBId },
    });

    return NextResponse.json({ message: "Qualifier and Eliminator generated." });
  }

  const step = nextPlayoffStep(existingKnockout);

  if (step.kind === "waiting") {
    return NextResponse.json({ message: step.waitingOn }, { status: 400 });
  }

  if (step.kind === "done") {
    return NextResponse.json({ message: "The tournament is already complete." });
  }

  await prisma.eventMatch.create({
    data: {
      trekId: eventId,
      stage: "KNOCKOUT",
      round: step.round,
      teamAId: step.teamAId,
      teamBId: step.teamBId,
    },
  });

  return NextResponse.json({ message: `${PLAYOFF_ROUND_LABELS[step.round]} generated.` });
}
