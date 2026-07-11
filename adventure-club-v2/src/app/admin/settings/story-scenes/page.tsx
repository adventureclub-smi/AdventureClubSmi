import StoryScenesManager from "@/components/admin/settings/StoryScenesManager";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function StoryScenesSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const scenes = await prisma.homepageStoryScene.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return <StoryScenesManager initialScenes={scenes} />;
}
