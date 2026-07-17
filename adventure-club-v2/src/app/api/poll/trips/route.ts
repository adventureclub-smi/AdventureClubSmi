import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getTripPollOptions } from "@/data/trip-poll";

export async function GET() {
  const [options, user] = await Promise.all([getTripPollOptions(), getCurrentUser()]);

  let myVote: string | null = null;

  if (user) {
    const vote = await prisma.tripPollVote.findUnique({ where: { userId: user.id } });
    myVote = vote?.trekId ?? null;
  }

  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);

  return NextResponse.json({
    options,
    totalVotes,
    loggedIn: Boolean(user),
    myVote,
  });
}
