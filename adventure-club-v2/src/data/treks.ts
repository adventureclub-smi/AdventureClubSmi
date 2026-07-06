import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
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

// So the homepage's featured-trek card can reflect the visiting student's
// actual registration status (Approved / Pay Initial Payment / Waiting for
// Verification / etc.) instead of always showing "Register Now" once
// they're already registered. Returns [] for anonymous visitors.
export async function getMyRegistrationsForHomepage(): Promise<
  MyRegistrationSummary[]
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return [];

  const payload = verifyToken(token);

  if (!payload) return [];

  const registrations = await prisma.registration.findMany({
    where: { userId: payload.id },
    include: { trek: { select: { tripCentrePublished: true } } },
  });

  return registrations.map((r) => ({
    id: r.id,
    trekId: r.trekId,
    status: r.status,
    initialPaymentDeadline: r.initialPaymentDeadline
      ? r.initialPaymentDeadline.toISOString()
      : null,
    initialPaymentPaid: r.initialPaymentPaid,
    offlinePaymentCreated: r.offlinePaymentCreated,
    offlinePaymentVerified: r.offlinePaymentVerified,
    bondFormSubmitted: r.bondFormSubmitted,
    attendanceMarked: r.attendanceMarked,
    finalPaymentUnlocked: r.finalPaymentUnlocked,
    finalPaymentPaid: r.finalPaymentPaid,
    certificateIssued: r.certificateIssued,
    trek: { tripCentrePublished: r.trek.tripCentrePublished },
  }));
}
