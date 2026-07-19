import ContactSubmissionsTable from "@/components/admin/ContactSubmissionsTable";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <ContactSubmissionsTable />;
}
