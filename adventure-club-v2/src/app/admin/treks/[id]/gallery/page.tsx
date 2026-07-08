import TrekGallery from "@/components/admin/TrekGallery";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const { id } = await params;

  return <TrekGallery trekId={id} />;
}
