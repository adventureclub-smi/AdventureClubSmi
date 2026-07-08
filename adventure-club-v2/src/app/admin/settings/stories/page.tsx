import StoriesManager from "@/components/admin/settings/StoriesManager";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function StoriesSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const stories = await prisma.homepageStory.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return <StoriesManager initialStories={stories} />;
}
