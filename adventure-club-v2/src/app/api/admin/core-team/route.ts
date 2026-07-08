import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCoreTeamAccess, ELECTABLE_POSITIONS } from "@/lib/core-team";

function tallyResults(
  positions: string[],
  ballots: { selections: unknown }[]
) {
  return positions.map((position) => {
    const counts = new Map<string, number>();

    ballots.forEach((ballot) => {
      const selections = ballot.selections as Record<string, string | string[]> | null;
      const value = selections?.[position];
      // A position's value is a single name (single-select) or an array of
      // names (multi-select "team" positions) — either way, each name
      // present gets one vote in this position's tally.
      const names = Array.isArray(value) ? value : value ? [value] : [];
      names.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));
    });

    const tally = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const maxCount = tally.length > 0 ? tally[0].count : 0;
    const winners = tally.filter((t) => t.count === maxCount).map((t) => t.name);

    return { position, tally, maxCount, winners };
  });
}

export async function GET() {
  const user = await requireCoreTeamAccess();

  const election = await prisma.coreTeamElection.findFirst({
    orderBy: { createdAt: "desc" },
    include: { ballots: true },
  });

  if (!election) {
    return NextResponse.json({ election: null });
  }

  const base = {
    id: election.id,
    status: election.status,
    roster: election.roster,
    positions: election.positions,
    createdAt: election.createdAt,
    publishedAt: election.publishedAt,
    closedAt: election.closedAt,
  };

  if (user.clubRole === "Admin") {
    return NextResponse.json({
      election: base,
      ballotCount: election.ballots.length,
      results: tallyResults(election.positions, election.ballots),
    });
  }

  const myBallot = election.ballots.find((b) => b.voterId === user.id);

  return NextResponse.json({
    election: base,
    myBallot: myBallot ? myBallot.selections : null,
  });
}

export async function POST(req: NextRequest) {
  const user = await requireCoreTeamAccess();

  if (user.clubRole !== "Admin") {
    return NextResponse.json({ message: "Only Admin can create an election." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const roster: string[] = Array.isArray(body.roster) ? body.roster : [];
    const positions: string[] =
      Array.isArray(body.positions) && body.positions.length > 0
        ? body.positions
        : ELECTABLE_POSITIONS;

    const existing = await prisma.coreTeamElection.findFirst({
      where: { status: { in: ["DRAFT", "PUBLISHED"] } },
    });

    if (existing) {
      return NextResponse.json(
        { message: "An election is already in progress. Close it before starting a new one." },
        { status: 400 }
      );
    }

    if (roster.length === 0) {
      return NextResponse.json({ message: "Add at least one name to the roster." }, { status: 400 });
    }

    const election = await prisma.coreTeamElection.create({
      data: { roster, positions, status: "DRAFT" },
    });

    return NextResponse.json({ election });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to create election." }, { status: 500 });
  }
}
