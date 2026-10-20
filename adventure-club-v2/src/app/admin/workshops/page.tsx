import TreksTable from "@/components/admin/TreksTable";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function WorkshopsPage() {
  await requireAdminAccess(["FULL"]);

  return <TreksTable mode="workshops" />;
}
