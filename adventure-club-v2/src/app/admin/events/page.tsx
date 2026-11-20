import EventsTable from "@/components/admin/EventsTable";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function EventsPage() {
  await requireAdminAccess(["FULL"]);

  return <EventsTable />;
}
