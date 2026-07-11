import HomepageStatsManager from "@/components/admin/settings/HomepageStatsManager";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function HomepageStatsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return <HomepageStatsManager />;
}
