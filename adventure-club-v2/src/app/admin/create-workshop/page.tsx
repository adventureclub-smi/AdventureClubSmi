import CreateWorkshopForm from "@/components/admin/CreateWorkshopForm";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function CreateWorkshopPage() {
  await requireAdminAccess(["FULL"]);

  return <CreateWorkshopForm />;
}
