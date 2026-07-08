import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCoreTeamAccess } from "@/lib/core-team";

export async function POST(req: NextRequest) {
  const user = await requireCoreTeamAccess();

  if (user.clubRole !== "Admin") {
    return NextResponse.json({ message: "Only Admin can close an election." }, { status: 403 });
  }

  try {
    const { electionId } = await req.json();

    const election = await prisma.coreTeamElection.findUnique({ where: { id: electionId } });

    if (!election) {
      return NextResponse.json({ message: "Election not found." }, { status: 404 });
    }

    if (election.status !== "PUBLISHED") {
      return NextResponse.json(
        { message: "Only a published election can be closed." },
        { status: 400 }
      );
    }

    const updated = await prisma.coreTeamElection.update({
      where: { id: electionId },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    return NextResponse.json({ election: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to close election." }, { status: 500 });
  }
}
