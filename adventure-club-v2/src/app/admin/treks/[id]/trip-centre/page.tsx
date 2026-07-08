import TripCentreEditor from "@/components/admin/trip-centre/TripCentreEditor";
import AnnouncementEditor from "@/components/admin/trip-centre/AnnouncementEditor";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  return (
    <>
      <TripCentreEditor trekId={id} />

      <AnnouncementEditor trekId={id} />
    </>
  );
}
