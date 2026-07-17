import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Please log in to vote." },
      { status: 401 }
    );
  }

  try {
    const { trekId } = await req.json();

    if (!trekId) {
      return NextResponse.json({ message: "trekId is required." }, { status: 400 });
    }

    const trek = await prisma.trek.findUnique({ where: { id: trekId } });

    if (!trek || (!trek.isHistorical && trek.status !== "COMPLETED")) {
      return NextResponse.json(
        { message: "That trip isn't part of the poll." },
        { status: 400 }
      );
    }

    await prisma.tripPollVote.upsert({
      where: { userId: user.id },
      update: { trekId },
      create: { userId: user.id, trekId },
    });

    return NextResponse.json({ message: "Vote recorded." });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to record vote." }, { status: 500 });
  }
}
