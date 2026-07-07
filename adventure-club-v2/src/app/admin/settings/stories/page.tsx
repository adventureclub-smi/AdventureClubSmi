import StoriesManager from "@/components/admin/settings/StoriesManager";
import { prisma } from "@/lib/prisma";

export default async function StoriesSettingsPage() {
  const stories = await prisma.homepageStory.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return <StoriesManager initialStories={stories} />;
}
