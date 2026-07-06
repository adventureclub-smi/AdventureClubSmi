import TripDetails from "@/components/dashboard/trip-centre/TripDetails";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TripDetails trekId={id} />;
}