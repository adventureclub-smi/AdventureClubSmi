import TrekGallery from "@/components/admin/TrekGallery";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TrekGallery trekId={id} />;
}
