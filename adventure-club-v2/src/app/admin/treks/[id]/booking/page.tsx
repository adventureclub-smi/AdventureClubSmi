import BookingManager from "@/components/admin/BookingManager";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL", "FINANCE", "VISUAL", "BOOKING"]);

  const { id } = await params;

  return <BookingManager trekId={id} />;
}
