import AttendanceOverview from "@/components/admin/AttendanceOverview";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <AttendanceOverview />;
}
