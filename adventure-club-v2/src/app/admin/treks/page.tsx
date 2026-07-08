import TreksTable from "@/components/admin/TreksTable";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function TreksPage() {
  await requireAdminAccess(["FULL"]);

  return <TreksTable />;
}
