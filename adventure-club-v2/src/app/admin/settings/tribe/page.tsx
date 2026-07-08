import TribeManager from "@/components/admin/settings/TribeManager";
import { getTribeMembers } from "@/data/tribe";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function TribeSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const members = await getTribeMembers();

  return <TribeManager initialMembers={members} />;
}
