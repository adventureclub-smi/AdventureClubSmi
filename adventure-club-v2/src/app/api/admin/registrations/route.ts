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
      take: 300,
    });

    return NextResponse.json(
      registrations.map((r) => ({
        id: r.id,
        registrationNumber: r.registrationNumber,
        participant: r.user?.fullName || r.guestName || "Unknown",
        clubId: r.user?.clubId || "-",
        trekId: r.trekId,
        trekTitle: r.trek.title,
        status: r.status,
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load registrations." },
      { status: 500 }
    );
  }
}
