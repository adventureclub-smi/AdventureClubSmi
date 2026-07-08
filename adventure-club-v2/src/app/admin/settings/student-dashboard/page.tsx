import StudentDashboardSettings from "@/components/admin/settings/StudentDashboardSettings";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function StudentDashboardSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  return <StudentDashboardSettings />;
}
