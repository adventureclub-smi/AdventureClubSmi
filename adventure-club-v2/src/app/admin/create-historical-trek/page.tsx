import CreateHistoricalTrekForm from "@/components/admin/CreateHistoricalTrekForm";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function CreateHistoricalTrekPage() {
  await requireAdminAccess(["FULL"]);

  return <CreateHistoricalTrekForm />;
}
