import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type ActivityItem = {
  id: string;
  type: "registration" | "payment" | "announcement" | "trip_centre";
  title: string;
  message: string;
  timestamp: string;
  href: string;
};

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const [registrations, payments, announcements, launchedTreks] =
      await Promise.all([
        prisma.registration.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: true, trek: true },
        }),

        prisma.payment.findMany({
          where: { status: "PAID" },
          orderBy: { paidAt: "desc" },
          take: 10,
          include: { registration: { include: { user: true, trek: true } } },
        }),

        prisma.tripAnnouncement.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { trek: true },
        }),

        prisma.trek.findMany({
          where: { tripCentrePublished: true, tripCentrePublishedAt: { not: null } },
          orderBy: { tripCentrePublishedAt: "desc" },
          take: 10,
        }),
      ]);

    const items: ActivityItem[] = [
      ...registrations.map((r) => ({
        id: `reg-${r.id}`,
        type: "registration" as const,
        title: "New registration",
        message: `${r.user?.fullName || r.guestName || "A student"} registered for ${r.trek.title}`,
        timestamp: r.createdAt.toISOString(),
        href: `/admin/treks/${r.trekId}/registrations`,
      })),

      ...payments
        .filter((p) => p.paidAt)
        .map((p) => ({
          id: `pay-${p.id}`,
          type: "payment" as const,
          title: "Payment verified",
          message: `${p.registration?.user?.fullName || p.registration?.guestName || "A student"} paid for ${p.registration?.trek.title || "a trek"}`,
          timestamp: (p.paidAt as Date).toISOString(),
          href: `/admin/treks/${p.registration?.trekId}/payments`,
        })),

      ...announcements.map((a) => ({
        id: `ann-${a.id}`,
        type: "announcement" as const,
        title: "Announcement posted",
        message: `${a.title} — ${a.trek.title}`,
        timestamp: a.createdAt.toISOString(),
        href: `/admin/treks/${a.trekId}/trip-centre`,
      })),

      ...launchedTreks.map((t) => ({
        id: `tc-${t.id}`,
        type: "trip_centre" as const,
        title: "Trip Centre launched",
        message: `${t.title}'s Trip Centre went live`,
        timestamp: (t.tripCentrePublishedAt as Date).toISOString(),
        href: `/admin/treks/${t.id}/trip-centre`,
      })),
    ]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 15);

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load activity." },
      { status: 500 }
    );
  }
}
