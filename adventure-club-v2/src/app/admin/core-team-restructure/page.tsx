import { redirect } from "next/navigation";

// Temporarily pulled off the live site — the feature (component, access
// helpers, etc.) is untouched, just not reachable right now. To bring it
// back: restore the body below and re-add CORE_TEAM_LINK to AdminSidebar's
// visibleLinks.
//
// import CoreTeamRestructure from "@/components/admin/CoreTeamRestructure";
// import { requireCoreTeamAccess } from "@/lib/core-team";
//
// export default async function Page() {
//   const user = await requireCoreTeamAccess();
//   return <CoreTeamRestructure isOrganizer={user.clubRole === "Admin"} />;
// }

export default function Page() {
  redirect("/admin");
}
