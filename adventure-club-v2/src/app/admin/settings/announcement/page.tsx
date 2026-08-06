import AnnouncementSettingsManager from "@/components/admin/settings/AnnouncementSettingsManager";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function AnnouncementSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return <AnnouncementSettingsManager />;
}
