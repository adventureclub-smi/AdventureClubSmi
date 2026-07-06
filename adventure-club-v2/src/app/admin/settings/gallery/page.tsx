import GalleryManager from "@/components/admin/settings/GalleryManager";
import { prisma } from "@/lib/prisma";

export default async function GallerySettingsPage() {
  const photos = await prisma.homepageGalleryPhoto.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return <GalleryManager initialPhotos={photos} />;
}
