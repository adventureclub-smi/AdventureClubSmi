import RegistrationsOverview from "@/components/admin/RegistrationsOverview";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function RegistrationsPage() {
  await requireAdminAccess(["FULL"]);

  return <RegistrationsOverview />;
}
