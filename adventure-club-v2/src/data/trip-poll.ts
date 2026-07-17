import { prisma } from "@/lib/prisma";
import { optimizeImage } from "@/lib/media-optimize";

export type TripPollOption = {
  trekId: string;
  title: string;
  destination: string;
  coverImage: string;
  voteCount: number;
};

export async function getTripPollOptions(): Promise<TripPollOption[]> {
  const [treks, votes] = await Promise.all([
    prisma.trek.findMany({
      where: { OR: [{ isHistorical: true }, { status: "COMPLETED" }] },
      select: { id: true, title: true, destination: true, coverImage: true },
    }),
    prisma.tripPollVote.findMany({ select: { trekId: true } }),
  ]);

  const counts = new Map<string, number>();
  for (const vote of votes) {
    counts.set(vote.trekId, (counts.get(vote.trekId) || 0) + 1);
  }

  return treks
    .map((trek) => ({
      trekId: trek.id,
      title: trek.title,
      destination: trek.destination,
      coverImage: optimizeImage(trek.coverImage) || "/images/default-trek.jpg",
      voteCount: counts.get(trek.id) || 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount);
}
