import TripCentreEditor from "@/components/admin/trip-centre/TripCentreEditor";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TripCentreEditor trekId={id} />;
}