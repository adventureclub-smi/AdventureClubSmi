import GalleryManager from "@/components/admin/settings/GalleryManager";
import GalleryHeroSettingsManager from "@/components/admin/settings/GalleryHeroSettingsManager";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function GallerySettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const [photos, heroSettings] = await Promise.all([
    prisma.homepageGalleryPhoto.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.galleryHeroSettings.findFirst(),
  ]);

  return (
    <div>
      <GalleryHeroSettingsManager initialSettings={heroSettings} />
      <GalleryManager initialPhotos={photos} />
    </div>
  );
}
