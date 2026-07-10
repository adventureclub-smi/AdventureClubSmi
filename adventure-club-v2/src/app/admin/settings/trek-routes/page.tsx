import TrekRoutesManager from "@/components/admin/settings/TrekRoutesManager";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function TrekRoutesPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return <TrekRoutesManager />;
}
