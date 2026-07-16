import { prisma } from "@/lib/prisma";
import type { ActivityCard } from "@/types/homepage";

export async function getActivities(): Promise<ActivityCard[]> {
  const activities = await prisma.homepageActivity.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return activities.map((activity) => ({
    id: activity.id,
    icon: activity.icon,
    title: activity.title,
    description: activity.description,
    backgroundImage: activity.imageUrl,
    highlights: activity.highlights,
    difficulty: activity.difficulty || undefined,
    bestSeason: activity.bestSeason || undefined,
    duration: activity.duration || undefined,
    funFact: activity.funFact || undefined,
    buttonText: activity.buttonText,
    buttonLink: activity.buttonLink,
    order: activity.order,
  }));
}
