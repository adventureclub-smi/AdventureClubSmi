import { prisma } from "@/lib/prisma";
import type { GalleryPhoto } from "@/types/homepage";
import { optimizeImage } from "@/lib/media-optimize";

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const photos = await prisma.homepageGalleryPhoto.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return photos.map((photo) => ({
    id: photo.id,
    src: optimizeImage(photo.imageUrl),
    alt: photo.caption || "Adventure Club gallery photo",
    caption: photo.caption || undefined,
  }));
}
