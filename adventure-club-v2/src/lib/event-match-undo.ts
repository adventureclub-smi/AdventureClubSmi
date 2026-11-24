import { prisma } from "@/lib/prisma";
import { roundsInvalidatedByUndo, type PlayoffRound } from "./event-playoff";
import { roundNamesForBracketSize } from "./event-bracket";

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

export type UndoMatchResult =
  | { ok: true; match: Awaited<ReturnType<typeof prisma.eventMatch.update>> }
  | { ok: false; message: string };

// Undoes one recorded match result — for mistakes, not for changing your
// mind about a match that had real downstream consequences. A GROUP-stage
// match is always safe to reset on its own (standings are computed live
// from whatever's COMPLETED). A KNOCKOUT match may have already had later
// rounds generated from its result, which would now be wrong, so those are
// deleted too — exactly the rounds that depended on this one, not the
// whole bracket. Shared by the single-match "Undo" button and the bulk
// "Undo All Results" action so both follow identical rules.
export async function undoMatchResult(eventId: string, matchId: string): Promise<UndoMatchResult> {
  const match = await prisma.eventMatch.findUnique({ where: { id: matchId } });

  if (!match || match.trekId !== eventId) {
    return { ok: false, message: "Match not found." };
  }

  if (match.status !== "COMPLETED") {
    return { ok: false, message: "This match hasn't been played yet — nothing to undo." };
  }

  if (!match.teamBId) {
    return { ok: false, message: "A bye isn't a real result — there's nothing to undo." };
  }

  if (match.stage === "KNOCKOUT") {
    const event = await prisma.trek.findUnique({ where: { id: eventId } });
    const allKnockout = await prisma.eventMatch.findMany({ where: { trekId: eventId, stage: "KNOCKOUT" } });

    let roundsToDelete: string[];

    if (event?.eventFormat === "DIRECT_KNOCKOUT") {
      const firstRoundName = allKnockout.reduce((earliest, m) => earliest ?? m.round, null as string | null);
      const firstRoundRows = allKnockout.filter((m) => m.round === firstRoundName);
      const startingTeamCount = firstRoundRows.reduce((sum, m) => sum + (m.teamBId ? 2 : 1), 0);
      const roundNames = roundNamesForBracketSize(nextPowerOfTwo(startingTeamCount));
      const matchRoundIndex = roundNames.indexOf(match.round!);
      roundsToDelete = roundNames.slice(matchRoundIndex + 1);
    } else {
      roundsToDelete = roundsInvalidatedByUndo(match.round as PlayoffRound);
    }

    if (roundsToDelete.length > 0) {
      await prisma.eventMatch.deleteMany({
        where: { trekId: eventId, stage: "KNOCKOUT", round: { in: roundsToDelete } },
      });
    }
  }

  const updated = await prisma.eventMatch.update({
    where: { id: matchId },
    data: {
      round1WinnerId: null,
      round2WinnerId: null,
      teamAScore: null,
      teamBScore: null,
      winnerTeamId: null,
      status: "SCHEDULED",
    },
  });

  return { ok: true, match: updated };
}
