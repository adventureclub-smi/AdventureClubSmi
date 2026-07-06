import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [
      users,
      treks,
      attendance,
      registrations,
      activeTreks,
      paidPayments,
      pendingPayments,
      attendancePending,
      certificatesIssued,
      upcomingDeadlines,
      portfolioTreks,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.trek.count(),

      prisma.registration.count({
        where: {
          attendanceMarked: true,
        },
      }),

      prisma.registration.count(),

      prisma.trek.count({ where: { date: { gte: new Date() } } }),

      prisma.payment.findMany({
        where: { status: "PAID" },
        select: { amount: true },
      }),

      prisma.registration.count({
        where: { offlinePaymentCreated: true, offlinePaymentVerified: false },
      }),

      prisma.registration.count({
        where: { initialPaymentPaid: true, attendanceMarked: false },
      }),

      prisma.registration.count({ where: { certificateIssued: true } }),

      prisma.registration.count({
        where: {
          initialPaymentPaid: false,
          initialPaymentDeadline: { lte: in7Days, gte: new Date() },
        },
      }),

      prisma.trek.count({
        where: {
          OR: [
            { distanceKm: { gt: 0 } },
            { altitudeMeters: { gt: 0 } },
            { campNights: { gt: 0 } },
          ],
        },
      }),
    ]);

    const revenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      users,
      treks,
      attendance,
      registrations,
      activeTreks,
      paymentsReceived: paidPayments.length,
      revenue,
      pendingPayments,
      attendancePending,
      certificatesIssued,
      upcomingDeadlines,
      portfolioEntries: portfolioTreks,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}