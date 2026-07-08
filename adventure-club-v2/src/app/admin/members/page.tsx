import MembersTable from "@/components/admin/MembersTable";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <MembersTable />;
}
