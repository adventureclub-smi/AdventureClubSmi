import { prisma } from "@/lib/prisma";
import type { StoryScene } from "@/types/homepage";
import { toCdnUrl } from "@/lib/cdn-url";
import { optimizeImage } from "@/lib/media-optimize";

export async function getStoryScenes(): Promise<StoryScene[]> {
  const scenes = await prisma.homepageStoryScene.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return scenes.map((scene) => ({
    id: scene.id,
    imageUrl: toCdnUrl(optimizeImage(scene.imageUrl)),
    imageWidth: scene.imageWidth,
    imageHeight: scene.imageHeight,
    caption: scene.caption || "",
    description: scene.description || "",
    order: scene.order,
  }));
}
