import { prisma } from "@/lib/prisma";
import { toCdnUrl } from "@/lib/cdn-url";
import { optimizeAudio, optimizeImage } from "@/lib/media-optimize";

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
    audioUrl: toCdnUrl(optimizeAudio(song.audioUrl)),
    thumbnailUrl: toCdnUrl(optimizeImage(song.thumbnailUrl)),
  }));
}
