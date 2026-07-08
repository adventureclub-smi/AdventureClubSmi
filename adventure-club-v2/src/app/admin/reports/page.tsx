import ReportsPage from "@/components/admin/ReportsPage";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL", "FINANCE"]);

  return <ReportsPage />;
}
