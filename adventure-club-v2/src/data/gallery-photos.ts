import { prisma } from "@/lib/prisma";
import type { GalleryPhoto } from "@/types/homepage";
import { toCdnUrl } from "@/lib/cdn-url";
import { optimizeImage } from "@/lib/media-optimize";

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const photos = await prisma.homepageGalleryPhoto.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return photos.map((photo) => ({
    id: photo.id,
    src: toCdnUrl(optimizeImage(photo.imageUrl)),
    alt: photo.caption || "Adventure Club gallery photo",
    caption: photo.caption || undefined,
  }));
}
