import CreateWorkshopForm from "@/components/admin/CreateWorkshopForm";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function CreateSessionPage() {
  await requireAdminAccess(["FULL"]);

  return <CreateWorkshopForm defaultActivityType="SESSION" />;
}
