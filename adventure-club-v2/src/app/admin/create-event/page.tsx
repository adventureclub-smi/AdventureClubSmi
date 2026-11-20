import CreateEventForm from "@/components/admin/CreateEventForm";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function CreateEventPage() {
  await requireAdminAccess(["FULL"]);

  return <CreateEventForm />;
}
