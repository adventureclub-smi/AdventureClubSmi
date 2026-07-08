import CreateTrekForm from "@/components/admin/CreateTrekForm";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function CreateTrekPage() {
  await requireAdminAccess(["FULL"]);

  return <CreateTrekForm />;
}
