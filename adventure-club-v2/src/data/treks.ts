import { prisma } from "@/lib/prisma";
import type { RegistrationLike } from "@/lib/registration-journey";
import type { TrekSummary, TrekMapPin } from "@/types/homepage";

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

// Deliberately includes historical treks — this is the one intentional
// exception to "historical treks stay out of public/global views": a map
// pin only exposes trek-level marketing info (title/destination/date/
// difficulty/photo), never registrations, payments, or participant data,
// so there's nothing sensitive in showing every trek the club has ever run.
export async function getTrekMapPins(): Promise<TrekMapPin[]> {
  const treks = await prisma.trek.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { date: "asc" },
  });

  return treks.map((trek) => ({
    id: trek.id,
    title: trek.title,
    destination: trek.destination,
    difficulty: trek.difficulty,
    date: trek.date.toISOString(),
    coverImage: trek.coverImage || "/images/default-trek.jpg",
    description: trek.description,
    isHistorical: trek.isHistorical,
    latitude: trek.latitude as number,
    longitude: trek.longitude as number,
  }));
}
