import { prisma } from "@/lib/prisma";
import { after } from "next/server";
import type { RegistrationLike } from "@/lib/registration-journey";
import type { TrekSummary, TrekMapPin, UpcomingTrekRoute } from "@/types/homepage";
import { optimizeImage, optimizeVideo } from "@/lib/media-optimize";
import {
  notifyRegistrationOpenedIfDue,
  notifyBirthdaysIfDue,
  timeOutOverdueRegistrationsIfDue,
} from "@/lib/notification-emails";

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

  after(async () => {
    try {
      await notifyBirthdaysIfDue();
    } catch (error) {
      console.error("Failed to process birthday notifications:", error);
    }
  });

  after(async () => {
    try {
      await timeOutOverdueRegistrationsIfDue();
    } catch (error) {
      console.error("Failed to process overdue-registration timeouts:", error);
    }
  });

  const treks = await prisma.trek.findMany({
    where: {
      date: { gte: new Date() },
      status: "Registration Open",
      // Every trek document must actually store this field for this filter
      // to match it — Prisma's MongoDB connector requires the field to
      // exist for every form of this filter (`false`, `{ not: true }`,
      // `{ NOT: { isTest: true } }` all behave identically here), so a
      // trek written by anything other than the app's own create/edit
      // routes (e.g. a future bulk-import script) MUST explicitly set
      // isTest itself or it silently disappears from every public query
      // that uses this filter. A one-off backfill already fixed every
      // trek that predated this field.
      isTest: false,
    },
    orderBy: { date: "asc" },
  });

  return treks.map((trek) => ({
    id: trek.id,
    title: trek.title,
    destination: trek.destination,
    difficulty: trek.difficulty,
    date: trek.date.toISOString(),
    price: trek.price,
    coverImage: optimizeImage(trek.coverImage) || "/images/default-trek.jpg",
    // Shown as-is on the public homepage rather than a live "spots left"
    // count — registration is never actually blocked once seats fill, so a
    // shrinking/"Full" number would just be a discouraging red herring.
    seats: trek.seats,
    registrationOpensAt: trek.registrationOpensAt
      ? trek.registrationOpensAt.toISOString()
      : null,
    registrationClosesAt: trek.registrationClosesAt
      ? trek.registrationClosesAt.toISOString()
      : null,
    registrationOpenedManually: trek.registrationOpenedManually,
    registrationClosedManually: trek.registrationClosedManually,
    registrationOpenForCoreOnly: trek.registrationOpenForCoreOnly,
    type: trek.type,
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
      // Every trek document must actually store this field for this filter
      // to match it — Prisma's MongoDB connector requires the field to
      // exist for every form of this filter (`false`, `{ not: true }`,
      // `{ NOT: { isTest: true } }` all behave identically here), so a
      // trek written by anything other than the app's own create/edit
      // routes (e.g. a future bulk-import script) MUST explicitly set
      // isTest itself or it silently disappears from every public query
      // that uses this filter. A one-off backfill already fixed every
      // trek that predated this field.
      isTest: false,
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
      // Every trek document must actually store this field for this filter
      // to match it — Prisma's MongoDB connector requires the field to
      // exist for every form of this filter (`false`, `{ not: true }`,
      // `{ NOT: { isTest: true } }` all behave identically here), so a
      // trek written by anything other than the app's own create/edit
      // routes (e.g. a future bulk-import script) MUST explicitly set
      // isTest itself or it silently disappears from every public query
      // that uses this filter. A one-off backfill already fixed every
      // trek that predated this field.
      isTest: false,
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
    previewVideoUrl: trek.routePreviewVideoUrl,
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
