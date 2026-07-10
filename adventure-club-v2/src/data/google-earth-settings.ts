import { prisma } from "@/lib/prisma";
import type { GoogleEarthContent } from "@/types/homepage";

export async function getGoogleEarthSettings(): Promise<GoogleEarthContent> {
  const [settings, stats] = await Promise.all([
    prisma.googleEarthSettings.findFirst(),
    prisma.trailStat.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return {
    earthUrl: settings?.earthUrl || "",
    trailStats: stats.map((stat) => ({
      id: stat.id,
      label: stat.label,
      value: stat.value,
      tooltip: stat.tooltip || "",
      order: stat.order,
    })),
  };
}
