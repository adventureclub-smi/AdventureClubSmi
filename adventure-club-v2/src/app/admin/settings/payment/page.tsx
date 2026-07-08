import PaymentSettings from "@/components/admin/settings/PaymentSettings";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function PaymentSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return <PaymentSettings />;
}
