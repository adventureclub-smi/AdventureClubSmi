import PageHeader from "@/components/admin/shared/PageHeader";
import SettingsQuickLinks from "@/components/admin/settings/SettingsQuickLinks";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function SettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return (
    <div>
      <PageHeader
        title="Settings"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      <SettingsQuickLinks />
    </div>
  );
}
