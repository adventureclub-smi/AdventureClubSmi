import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type NotificationItem = {
  id: string;
  type: "waiting" | "payment_verification" | "deadline";
  title: string;
  message: string;
  href: string;
  createdAt: string;
};

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const [waiting, pendingOffline, upcomingDeadlines, closingSoon] =
      await Promise.all([
        prisma.registration.findMany({
          where: { status: "WAITING" },
          include: { user: true, trek: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),

        prisma.registration.findMany({
          where: { offlinePaymentCreated: true, offlinePaymentVerified: false },
          include: { user: true, trek: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),

        prisma.registration.findMany({
          where: {
            initialPaymentPaid: false,
            initialPaymentDeadline: { lte: in48h, gte: new Date() },
          },
          include: { user: true, trek: true },
          take: 10,
        }),

        prisma.trek.findMany({
          where: {
            registrationClosesAt: { lte: in48h, gte: new Date() },
          },
          take: 10,
        }),
      ]);

    const items: NotificationItem[] = [
      ...waiting.map((r) => ({
        id: `waiting-${r.id}`,
        type: "waiting" as const,
        title: "Registration awaiting approval",
        message: `${r.user?.fullName || r.guestName || "A student"} registered for ${r.trek.title}`,
        href: `/admin/treks/${r.trekId}/registrations`,
        createdAt: r.createdAt.toISOString(),
      })),

      ...pendingOffline.map((r) => ({
        id: `payment-${r.id}`,
        type: "payment_verification" as const,
        title: "Payment needs verification",
        message: `${r.user?.fullName || r.guestName || "A student"}'s offline payment for ${r.trek.title} is pending verification`,
        href: `/admin/treks/${r.trekId}/payments`,
        createdAt: r.createdAt.toISOString(),
      })),

      ...upcomingDeadlines.map((r) => ({
        id: `deadline-${r.id}`,
        type: "deadline" as const,
        title: "Initial payment deadline approaching",
        message: `${r.user?.fullName || r.guestName || "A student"}'s deadline for ${r.trek.title} is within 48 hours`,
        href: `/admin/treks/${r.trekId}/payments`,
        createdAt: r.createdAt.toISOString(),
      })),

      ...closingSoon.map((t) => ({
        id: `closing-${t.id}`,
        type: "deadline" as const,
        title: "Registration closing soon",
        message: `Registrations for ${t.title} close within 48 hours`,
        href: `/admin/treks/${t.id}/registrations`,
        createdAt: t.createdAt.toISOString(),
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ count: items.length, items });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load notifications." },
      { status: 500 }
    );
  }
}
