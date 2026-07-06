import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const registrations = await prisma.registration.findMany({
      include: { user: true, trek: true },
      orderBy: { createdAt: "desc" },
    });

    const rows = registrations.map((r) => ({
      registrationNumber: r.registrationNumber,
      participant: r.user?.fullName || r.guestName || "",
      clubId: r.user?.clubId || "",
      trek: r.trek.title,
      status: r.status,
      initialPaymentPaid: r.initialPaymentPaid,
      finalPaymentPaid: r.finalPaymentPaid,
      attendanceMarked: r.attendanceMarked,
      certificateIssued: r.certificateIssued,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to export registrations." },
      { status: 500 }
    );
  }
}
