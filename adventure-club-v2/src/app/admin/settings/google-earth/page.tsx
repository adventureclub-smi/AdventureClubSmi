import GoogleEarthSettingsManager from "@/components/admin/settings/GoogleEarthSettingsManager";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function GoogleEarthSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return <GoogleEarthSettingsManager />;
}
