import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { computeTrekFinance } from "@/lib/trek-finance";

// Year/department are free text in practice ("3rd YEAR" vs "3rd Year" both
// show up in real data) — normalizing case for grouping keeps those from
// splitting into separate pie slices that are really the same group.
function bucket(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "-" ? trimmed.toUpperCase() : "Unspecified";
}

function toDistribution(counts: Map<string, number>) {
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ONLINE: "Online",
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: trekId } = await params;

    const trek = await prisma.trek.findUnique({ where: { id: trekId } });

    if (!trek) {
      return NextResponse.json({ message: "Trek not found." }, { status: 404 });
    }

    const [registrations, finance, paidPayments] = await Promise.all([
      prisma.registration.findMany({
        where: { trekId },
        include: { user: { select: { year: true, department: true } } },
      }),
      computeTrekFinance(trekId),
      // Actual paid transactions, not registration.paymentMethod — that field
      // is just a display mirror of whichever payment was recorded last, so
      // it can't tell initial and final payments made by different methods
      // apart the way the real per-payment records can.
      prisma.payment.findMany({
        where: { status: "PAID", registration: { trekId } },
        select: { paymentMethod: true },
      }),
    ]);

    const byYear = new Map<string, number>();
    const byCourse = new Map<string, number>();
    const byStatus = new Map<string, number>();

    // Attendance/payment only mean something once a registration actually
    // has a seat — WAITING/REJECTED/WAITLIST never got one, so they're
    // excluded here the same way the Attendance tab excludes them.
    let attendedCount = 0;
    let notAttendedCount = 0;
    let initialPaidCount = 0;
    let finalPaidCount = 0;
    const seatedStatuses = new Set(["APPROVED", "COMPLETED", "MISSED"]);
    let seatedCount = 0;

    for (const r of registrations) {
      const year = bucket(r.user?.year ?? r.guestYear);
      const course = bucket(r.user?.department ?? r.guestDepartment);

      byYear.set(year, (byYear.get(year) ?? 0) + 1);
      byCourse.set(course, (byCourse.get(course) ?? 0) + 1);
      byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);

      if (seatedStatuses.has(r.status)) {
        seatedCount += 1;
        if (r.attendanceMarked) attendedCount += 1;
        else notAttendedCount += 1;
        if (r.initialPaymentPaid) initialPaidCount += 1;
        if (r.finalPaymentPaid) finalPaidCount += 1;
      }
    }

    const byPaymentMethod = new Map<string, number>();
    for (const p of paidPayments) {
      const label = p.paymentMethod ? PAYMENT_METHOD_LABELS[p.paymentMethod] : "Not Recorded";
      byPaymentMethod.set(label, (byPaymentMethod.get(label) ?? 0) + 1);
    }

    return NextResponse.json({
      trek: {
        id: trek.id,
        title: trek.title,
        destination: trek.destination,
        date: trek.date,
        difficulty: trek.difficulty,
        price: trek.price,
        initialPayment: trek.initialPayment,
        finalPayment: trek.finalPayment,
        seats: trek.seats,
      },
      registrations: {
        total: registrations.length,
        byYear: toDistribution(byYear),
        byCourse: toDistribution(byCourse),
        byStatus: toDistribution(byStatus),
      },
      attendance: {
        seatedCount,
        attended: attendedCount,
        notAttended: notAttendedCount,
      },
      payments: {
        seatedCount,
        initialPaidCount,
        initialPendingCount: seatedCount - initialPaidCount,
        finalPaidCount,
        finalPendingCount: seatedCount - finalPaidCount,
        byMethod: toDistribution(byPaymentMethod),
      },
      finance: finance.totals,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to load trek report." }, { status: 500 });
  }
}
