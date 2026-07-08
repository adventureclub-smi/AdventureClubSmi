import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { isCoreTeamRole } from "@/lib/core-team-roles";

export {
  ELEVATED_CLUB_ROLES,
  NON_CORE_CLUB_ROLES,
  PLAIN_CORE_CLUB_ROLES,
  ELECTABLE_POSITIONS,
  clubRoleBucket,
  isCoreTeamRole,
} from "@/lib/core-team-roles";

// Distinct from requireAdminAccess() (the operational Full/Finance/Visual/
// Booking tier gate) — visibility of this one feature is governed purely by
// club role, since a President/Treasurer could later grant a core-role
// person some other operational tier without that changing their standing
// as a voter here.
export async function requireCoreTeamAccess() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  if (!(user.clubRole === "Admin" || isCoreTeamRole(user.clubRole))) {
    redirect("/admin");
  }

  return user;
}
