import { prisma } from "@/lib/prisma";
import type { StoryScene } from "@/types/homepage";

export async function getStoryScenes(): Promise<StoryScene[]> {
  const scenes = await prisma.homepageStoryScene.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return scenes.map((scene) => ({
    id: scene.id,
    imageUrl: scene.imageUrl,
    imageWidth: scene.imageWidth,
    imageHeight: scene.imageHeight,
    caption: scene.caption || "",
    order: scene.order,
  }));
}
