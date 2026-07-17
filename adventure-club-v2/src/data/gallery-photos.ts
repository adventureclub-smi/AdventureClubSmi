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
    category: photo.category || undefined,
    // Older photos uploaded before dimensions were tracked fall back to real
    // pixel dimensions at a reasonable portrait ratio — next/image treats
    // width/height as actual intrinsic pixels, not a ratio, so a tiny value
    // like 4x5 breaks its optimizer (400s on every request).
    width: photo.width || 800,
    height: photo.height || 1000,
  }));
}
