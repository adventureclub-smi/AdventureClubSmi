import { prisma } from "@/lib/prisma";
import type { StatItem } from "@/types/homepage";

export async function getHomepageStats(): Promise<StatItem[]> {
  const stats = await prisma.homepageStat.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return stats.map((stat) => ({
    id: stat.id,
    value: stat.value,
    suffix: stat.suffix || "",
    label: stat.label,
  }));
}
