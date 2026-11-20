import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string; matchId: string }> };

// Records a match result — tug of war (best-of-pulls) always has a clear
// winner, no draws, so winnerTeamId is required; the scores are just for
// display (e.g. "2-1").
export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId, matchId } = await context.params;
    const { teamAScore, teamBScore, winnerTeamId } = await req.json();

    const match = await prisma.eventMatch.findUnique({ where: { id: matchId } });

    if (!match || match.trekId !== eventId) {
      return NextResponse.json({ message: "Match not found." }, { status: 404 });
    }

    if (winnerTeamId !== match.teamAId && winnerTeamId !== match.teamBId) {
      return NextResponse.json(
        { message: "Winner must be one of the two teams in this match." },
        { status: 400 }
      );
    }

    const updated = await prisma.eventMatch.update({
      where: { id: matchId },
      data: {
        teamAScore: teamAScore === undefined || teamAScore === null ? null : Number(teamAScore),
        teamBScore: teamBScore === undefined || teamBScore === null ? null : Number(teamBScore),
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
