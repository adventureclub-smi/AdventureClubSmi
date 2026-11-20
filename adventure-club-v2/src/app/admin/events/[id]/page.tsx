import EventOverview from "@/components/admin/events/EventOverview";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  return <EventOverview eventId={id} />;
}
