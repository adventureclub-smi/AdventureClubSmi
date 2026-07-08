import GalleryManager from "@/components/admin/settings/GalleryManager";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function GallerySettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const photos = await prisma.homepageGalleryPhoto.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return <GalleryManager initialPhotos={photos} />;
}
