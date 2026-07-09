import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const [pending, treks] = await Promise.all([
      prisma.registration.findMany({
        where: {
          offlinePaymentCreated: true,
          offlinePaymentVerified: false,
          trek: { isHistorical: false },
        },
        include: { user: true, trek: true },
        orderBy: { createdAt: "desc" },
      }),

      prisma.trek.findMany({
        where: { date: { gte: new Date() }, isHistorical: false },
        orderBy: { date: "asc" },
        include: { registrations: true },
      }),
    ]);

    const pendingVerification = pending.map((r) => ({
      id: r.id,
      participant: r.user?.fullName || r.guestName || "Unknown",
      trekId: r.trekId,
      trekTitle: r.trek.title,
      amount: r.paymentAmount ?? 0,
      method: r.paymentMethod ?? "Not Recorded",
      createdAt: r.createdAt,
    }));

    const trekSummaries = treks.map((trek) => {
      const total = trek.registrations.length;
      const collected = trek.registrations.filter((r) => r.initialPaymentPaid).length;
      const pendingCount = total - collected;

      return {
        id: trek.id,
        title: trek.title,
        total,
        collected,
        pending: pendingCount,
      };
    });

    return NextResponse.json({ pendingVerification, treks: trekSummaries });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load payments overview." },
      { status: 500 }
    );
  }
}
