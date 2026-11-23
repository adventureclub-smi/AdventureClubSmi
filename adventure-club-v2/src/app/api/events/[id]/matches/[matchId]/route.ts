import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string; matchId: string }> };

// Records a match result from its two rounds — each round always has a
// clear winner, never a tie. Win=3/Draw=1/Loss=0 (see event-points-table.ts)
// falls straight out of that: win both rounds = 3 points, split 1-1 = 1
// point each. teamAScore/teamBScore are derived here as rounds won (0-2),
// not entered directly, so every existing "(2-1)"-style score display
// keeps working unchanged.
//
// A KNOCKOUT match can't advance as a draw, so a 1-1 split there requires
// an explicit tiebreakWinnerId alongside the two round winners.
export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId, matchId } = await context.params;
    const { round1WinnerId, round2WinnerId, tiebreakWinnerId } = await req.json();

    const match = await prisma.eventMatch.findUnique({ where: { id: matchId } });

    if (!match || match.trekId !== eventId) {
      return NextResponse.json({ message: "Match not found." }, { status: 404 });
    }

    if (!match.teamBId) {
      return NextResponse.json({ message: "This match is a bye — there's nothing to record." }, { status: 400 });
    }

    const validTeamIds = [match.teamAId, match.teamBId];

    if (!validTeamIds.includes(round1WinnerId) || !validTeamIds.includes(round2WinnerId)) {
      return NextResponse.json(
        { message: "Each round's winner must be one of the two teams in this match." },
        { status: 400 }
      );
    }

    const teamAScore = [round1WinnerId, round2WinnerId].filter((id) => id === match.teamAId).length;
    const teamBScore = 2 - teamAScore;

    let winnerTeamId: string | null;

    if (teamAScore === 2) {
      winnerTeamId = match.teamAId;
    } else if (teamBScore === 2) {
      winnerTeamId = match.teamBId;
    } else if (match.stage === "KNOCKOUT") {
      // Split 1-1 — a playoff match can't stay a draw, so a tie-break
      // winner is required to decide who advances.
      if (!validTeamIds.includes(tiebreakWinnerId)) {
        return NextResponse.json(
          { message: "This match split 1-1 — pick a tie-break winner to advance." },
          { status: 400 }
        );
      }
      winnerTeamId = tiebreakWinnerId;
    } else {
      winnerTeamId = null;
    }

    const updated = await prisma.eventMatch.update({
      where: { id: matchId },
      data: {
        round1WinnerId,
        round2WinnerId,
        teamAScore,
        teamBScore,
        winnerTeamId,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ message: "Result recorded.", match: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
