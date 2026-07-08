import PaymentsOverview from "@/components/admin/PaymentsOverview";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL", "FINANCE"]);

  return <PaymentsOverview />;
}
