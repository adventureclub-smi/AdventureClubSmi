import TribeBackgroundManager from "@/components/admin/settings/TribeBackgroundManager";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <TribeBackgroundManager />;
}
