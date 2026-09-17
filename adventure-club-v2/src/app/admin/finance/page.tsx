import ClubFinance from "@/components/admin/ClubFinance";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL", "FINANCE"]);

  return <ClubFinance />;
}
