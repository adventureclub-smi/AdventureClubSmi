import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string; matchId: string }> };

// Records a match result. Group-stage matches can end in a draw (pass
// winnerTeamId: null) — Win=3/Draw=1/Loss=0, see event-points-table.ts.
// Knockout matches must always produce a winner, since the bracket can't
// advance a drawn tie.
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

    const isDraw = winnerTeamId === null || winnerTeamId === undefined;

    if (isDraw && match.stage === "KNOCKOUT") {
      return NextResponse.json(
        { message: "A knockout match must have a winner — no draws." },
        { status: 400 }
      );
    }

    if (!isDraw && winnerTeamId !== match.teamAId && winnerTeamId !== match.teamBId) {
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
        winnerTeamId: isDraw ? null : winnerTeamId,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ message: "Result recorded.", match: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
