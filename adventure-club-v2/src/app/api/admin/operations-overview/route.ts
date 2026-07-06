import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

function stage(count: number, total: number) {
  return { count, total, pct: total ? Math.round((count / total) * 100) : 0 };
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const treks = await prisma.trek.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 6,
      include: { registrations: true },
    });

    const overview = treks.map((trek) => {
      const total = trek.registrations.length;

      return {
        id: trek.id,
        title: trek.title,
        date: trek.date,
        tripCentrePublished: trek.tripCentrePublished,
        stages: {
          registration: stage(total, total),
          payment: stage(
            trek.registrations.filter((r) => r.initialPaymentPaid).length,
            total
          ),
          bondForm: stage(
            trek.registrations.filter((r) => r.bondFormSubmitted).length,
            total
          ),
          tripCentre: stage(trek.tripCentrePublished ? 1 : 0, 1),
          attendance: stage(
            trek.registrations.filter((r) => r.attendanceMarked).length,
            total
          ),
          finalPayment: stage(
            trek.registrations.filter((r) => r.finalPaymentPaid).length,
            total
          ),
          completion: stage(
            trek.registrations.filter((r) => r.status === "COMPLETED").length,
            total
          ),
          certificates: stage(
            trek.registrations.filter((r) => r.certificateIssued).length,
            total
          ),
        },
      };
    });

    return NextResponse.json(overview);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load operations overview." },
      { status: 500 }
    );
  }
}
