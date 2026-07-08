import CertificateSettings from "@/components/admin/settings/CertificateSettings";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function CertificateSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return <CertificateSettings />;
}
