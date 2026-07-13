import { prisma } from "@/lib/prisma";
import { after } from "next/server";
import type { RegistrationLike } from "@/lib/registration-journey";
import type { TrekSummary, TrekMapPin, UpcomingTrekRoute } from "@/types/homepage";
import { optimizeImage, optimizeVideo } from "@/lib/media-optimize";
import { notifyRegistrationOpenedIfDue } from "@/lib/notification-emails";

export async function getUpcomingTreks(): Promise<TrekSummary[]> {
  // Piggybacks the "registrations just opened -> email Notify Me subscribers"
  // check on homepage/list visits (no cron in this project) — cheap no-op
  // once every due trek has already been notified. Runs after the response
  // is sent so a large notify list can't stall the homepage's render.
  after(async () => {
    try {
      await notifyRegistrationOpenedIfDue();
    } catch (error) {
      console.error("Failed to process registration-open notifications:", error);
    }
  });

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
    coverImage: optimizeImage(trek.coverImage) || "/images/default-trek.jpg",
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
    coverImage: optimizeImage(trek.coverImage) || "/images/default-trek.jpg",
    description: trek.description,
    isHistorical: trek.isHistorical,
    latitude: trek.latitude as number,
    longitude: trek.longitude as number,
  }));
}

// Same "upcoming" definition as getUpcomingTreks() — these are the exact
// treks listed in the Upcoming Treks section above the 3D route preview, so
// only ones an admin has actually set waypoints for show up in the picker.
export async function getUpcomingTrekRoutes(): Promise<UpcomingTrekRoute[]> {
  const treks = await prisma.trek.findMany({
    where: {
      date: { gte: new Date() },
      status: "Registration Open",
      waypoints: { some: {} },
    },
    orderBy: { date: "asc" },
    include: {
      waypoints: { orderBy: { order: "asc" } },
    },
  });

  return treks.map((trek) => ({
    trekId: trek.id,
    title: trek.title,
    destination: trek.destination,
    date: trek.date.toISOString(),
    waypoints: trek.waypoints.map((w) => {
      const mediaType = w.mediaType === "video" ? "video" : ("image" as const);
      const optimizedMedia = mediaType === "video" ? optimizeVideo(w.mediaUrl) : optimizeImage(w.mediaUrl);

      return {
        id: w.id,
        label: w.label,
        description: w.description || "",
        latitude: w.latitude,
        longitude: w.longitude,
        mediaUrl: optimizedMedia || "",
        mediaType,
        order: w.order,
      };
    }),
  }));
}
