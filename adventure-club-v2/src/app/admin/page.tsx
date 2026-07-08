import AdminDashboard from "@/components/admin/AdminDashboard";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function AdminPage() {
  await requireAdminAccess(["FULL"]);

  return <AdminDashboard />;
}
