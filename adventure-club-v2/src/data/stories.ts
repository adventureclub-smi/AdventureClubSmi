import { prisma } from "@/lib/prisma";
import type { Story } from "@/types/homepage";

export async function getStories(): Promise<Story[]> {
  const stories = await prisma.homepageStory.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return stories.map((story) => ({
    id: story.id,
    title: story.title,
    description: story.description,
    media: [{ type: "image", src: story.imageUrl }],
    order: story.order,
    published: story.published,
  }));
}
