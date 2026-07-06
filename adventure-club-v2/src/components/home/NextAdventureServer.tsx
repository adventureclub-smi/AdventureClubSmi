import { prisma } from "@/lib/prisma";
import NextAdventure from "./NextAdventure";

export default async function NextAdventureServer() {
  const trek = await prisma.trek.findFirst({
    where: {
      date: {
        gte: new Date(),
      },
      status: "Registration Open",
    },
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      title: true,
      date: true,
    },
  });

  if (!trek) {
    return null;
  }

  return (
    <NextAdventure
      trek={{
        id: trek.id,
        title: trek.title,
        date: trek.date.toISOString(),
      }}
    />
  );
}