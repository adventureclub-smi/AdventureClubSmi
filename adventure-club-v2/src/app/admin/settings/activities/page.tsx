import ActivitiesManager from "@/components/admin/settings/ActivitiesManager";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function ActivitiesSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const activities = await prisma.homepageActivity.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return <ActivitiesManager initialActivities={activities} />;
}
