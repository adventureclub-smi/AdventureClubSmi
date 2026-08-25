import RecruitmentAdmin from "@/components/admin/RecruitmentAdmin";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <RecruitmentAdmin />;
}
