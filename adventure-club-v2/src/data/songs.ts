import { prisma } from "@/lib/prisma";

export type SongSummary = {
  id: string;
  title: string;
  audioUrl: string;
  thumbnailUrl: string;
};

export async function getSongs(): Promise<SongSummary[]> {
  const songs = await prisma.song.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return songs.map((song) => ({
    id: song.id,
    title: song.title,
    audioUrl: song.audioUrl,
    thumbnailUrl: song.thumbnailUrl,
  }));
}
