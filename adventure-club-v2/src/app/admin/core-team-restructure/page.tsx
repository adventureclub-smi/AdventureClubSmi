import CoreTeamRestructure from "@/components/admin/CoreTeamRestructure";
import { requireCoreTeamAccess } from "@/lib/core-team";

export default async function Page() {
  const user = await requireCoreTeamAccess();

  return <CoreTeamRestructure isOrganizer={user.clubRole === "Admin"} />;
}
