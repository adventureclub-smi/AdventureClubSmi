import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { computeGroupStandings } from "@/lib/event-points-table";
import { seedInitialBracket, nextRoundPairs, roundNamesForBracketSize } from "@/lib/event-bracket";

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

// One "advance the bracket" action, re-used for every step: generates the
// first knockout round from the finished group stage, or — once called
// again after a round's results are in — pairs up that round's winners into
// the next one. The admin UI just has a single button it keeps clicking.
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

    if (existingKnockout.length === 0) {
      if (!event.eventQualifiersCount) {
        return NextResponse.json(
          { message: "Set the qualifier count in Team Allocation's tournament settings before generating the bracket." },
          { status: 400 }
        );
      }

      const groupMatches = await prisma.eventMatch.findMany({
        where: { trekId: eventId, stage: "GROUP" },
      });

      const unplayed = groupMatches.filter((m) => m.status !== "COMPLETED");
      if (unplayed.length > 0) {
        return NextResponse.json(
          { message: "The group stage isn't finished yet." },
          { status: 400 }
        );
      }

      const standings = computeGroupStandings(
        teams,
        groupMatches.map((m) => ({
          teamAId: m.teamAId,
          teamBId: m.teamBId ?? "",
          winnerTeamId: m.winnerTeamId,
          status: m.status,
          groupNumber: m.groupNumber,
        })),
        event.eventQualifiersCount,
        event.eventDrawSeed ?? ""
      );

      const qualifiers = standings
        .flatMap((group) =>
          group.rows
            .filter((row) => row.qualified)
            .map((row, positionInGroup) => ({ row, positionInGroup }))
        )
        .sort((a, b) => {
          if (a.positionInGroup !== b.positionInGroup) return a.positionInGroup - b.positionInGroup;
          if (a.row.points !== b.row.points) return b.row.points - a.row.points;
          return (
            seededTiebreak(a.row.teamId, event.eventDrawSeed ?? "") -
            seededTiebreak(b.row.teamId, event.eventDrawSeed ?? "")
          );
        })
        .map(({ row }, i) => ({ teamId: row.teamId, seed: i + 1 }));

      if (qualifiers.length < 2) {
        return NextResponse.json(
          { message: "Not enough qualifying teams to start a bracket." },
          { status: 400 }
        );
      }

      const { roundName, slots } = seedInitialBracket(qualifiers);

      for (const slot of slots) {
        if (slot.type === "bye") {
          await prisma.eventMatch.create({
            data: {
              trekId: eventId,
              stage: "KNOCKOUT",
              round: roundName,
              teamAId: slot.teamId,
              teamBId: null,
              winnerTeamId: slot.teamId,
              status: "COMPLETED",
            },
          });
        } else {
          await prisma.eventMatch.create({
            data: {
              trekId: eventId,
              stage: "KNOCKOUT",
              round: roundName,
              teamAId: slot.teamAId,
              teamBId: slot.teamBId,
            },
          });
        }
      }

      return NextResponse.json({ message: `${roundName} bracket generated.`, round: roundName });
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
    // 1 — which works the same whether that round came from group-stage
    // qualifiers (LEAGUE_KNOCKOUT) or directly from every team
    // (DIRECT_KNOCKOUT), instead of relying on eventQualifiersCount (which
    // DIRECT_KNOCKOUT events never set).
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
