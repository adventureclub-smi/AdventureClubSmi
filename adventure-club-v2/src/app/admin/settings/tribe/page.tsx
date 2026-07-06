import TribeManager from "@/components/admin/settings/TribeManager";
import { getTribeMembers } from "@/data/tribe";

export default async function TribeSettingsPage() {
  const members = await getTribeMembers();

  return <TribeManager initialMembers={members} />;
}
