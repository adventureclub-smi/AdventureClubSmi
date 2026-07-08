import { prisma } from "@/lib/prisma";
import type { RegistrationLike } from "@/lib/registration-journey";
import type { TrekSummary } from "@/types/homepage";

export async function getUpcomingTreks(): Promise<TrekSummary[]> {
  const treks = await prisma.trek.findMany({
    where: {
      date: { gte: new Date() },
      status: "Registration Open",
    },
    orderBy: { date: "asc" },
    include: {
      _count: {
        select: { registrations: { where: { status: "APPROVED" } } },
      },
    },
  });

  return treks.map((trek) => ({
    id: trek.id,
    title: trek.title,
    destination: trek.destination,
    difficulty: trek.difficulty,
    date: trek.date.toISOString(),
    price: trek.price,
    coverImage: trek.coverImage || "/images/default-trek.jpg",
    seatsLeft: Math.max(trek.seats - trek._count.registrations, 0),
    registrationOpensAt: trek.registrationOpensAt
      ? trek.registrationOpensAt.toISOString()
      : null,
  }));
}

export type MyRegistrationSummary = RegistrationLike & { trekId: string };
