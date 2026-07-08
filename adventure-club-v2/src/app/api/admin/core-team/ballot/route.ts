import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCoreTeamAccess } from "@/lib/core-team";

export async function POST(req: NextRequest) {
  const user = await requireCoreTeamAccess();

  if (user.clubRole === "Admin") {
    return NextResponse.json(
      { message: "Admin organizes the election and doesn't vote." },
      { status: 403 }
    );
  }

  try {
    const { electionId, selections } = await req.json();

    if (!electionId || typeof selections !== "object" || selections === null) {
      return NextResponse.json({ message: "Invalid ballot." }, { status: 400 });
    }

    const election = await prisma.coreTeamElection.findUnique({ where: { id: electionId } });

    if (!election || election.status !== "PUBLISHED") {
      return NextResponse.json(
        { message: "This election isn't open for voting right now." },
        { status: 400 }
      );
    }

    // Each position's value is either a single name (single-select
    // positions) or an array of names (multi-select "team" positions) —
    // flatten everything to check that no one is picked twice anywhere on
    // the ballot, whether that's across two positions or twice within the
    // same multi-select position.
    const filledNames = Object.values(selections).flatMap((value) => {
      if (typeof value === "string") return value.length > 0 ? [value] : [];
      if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && v.length > 0);
      return [];
    });

    const uniqueNames = new Set(filledNames);

    if (uniqueNames.size !== filledNames.length) {
      return NextResponse.json(
        { message: "The same person can't be picked for more than one position." },
        { status: 400 }
      );
    }

    const ballot = await prisma.coreTeamBallot.upsert({
      where: { electionId_voterId: { electionId, voterId: user.id } },
      create: {
        electionId,
        voterId: user.id,
        voterName: user.fullName,
        selections,
      },
      update: {
        selections,
      },
    });

    return NextResponse.json({ message: "Ballot submitted.", ballot });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to submit ballot." }, { status: 500 });
  }
}
