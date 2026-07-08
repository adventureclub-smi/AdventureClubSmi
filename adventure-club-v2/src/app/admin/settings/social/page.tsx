import SocialSettings from "@/components/admin/settings/SocialSettings";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function SocialSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return <SocialSettings />;
}
