import BookingManager from "@/components/admin/BookingManager";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BookingManager trekId={id} />;
}
