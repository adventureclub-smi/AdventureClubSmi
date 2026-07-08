import PortfolioOverview from "@/components/admin/PortfolioOverview";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <PortfolioOverview />;
}
