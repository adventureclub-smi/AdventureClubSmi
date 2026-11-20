import CreateEventForm from "@/components/admin/CreateEventForm";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  return <CreateEventForm eventId={id} />;
}
