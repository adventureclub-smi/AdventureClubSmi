import TripCentreEditor from "@/components/admin/trip-centre/TripCentreEditor";
import AnnouncementEditor from "@/components/admin/trip-centre/AnnouncementEditor";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <TripCentreEditor trekId={id} />

      <AnnouncementEditor trekId={id} />
    </>
  );
}