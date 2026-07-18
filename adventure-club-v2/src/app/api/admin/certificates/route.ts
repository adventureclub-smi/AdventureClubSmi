import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const trekId = req.nextUrl.searchParams.get("trekId") || undefined;

    const [candidates, issued] = await Promise.all([
      prisma.registration.findMany({
        where: {
          attendanceMarked: true,
          certificateIssued: false,
          trek: { isHistorical: false },
          ...(trekId ? { trekId } : {}),
        },
        include: { user: true, trek: true },
        orderBy: { createdAt: "desc" },
      }),

      prisma.registration.findMany({
        where: {
          certificateIssued: true,
          trek: { isHistorical: false },
          ...(trekId ? { trekId } : {}),
        },
        include: { user: true, trek: true, certificate: true },
        orderBy: { certificateIssuedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      candidates: candidates.map((r) => ({
        id: r.id,
        participant: r.user?.fullName || r.guestName || "Unknown",
        trekId: r.trekId,
        trekTitle: r.trek.title,
      })),

      issued: issued.map((r) => ({
        id: r.id,
        participant: r.user?.fullName || r.guestName || "Unknown",
        trekId: r.trekId,
        trekTitle: r.trek.title,
        certificateUrl: r.certificate?.certificateUrl || null,
        issuedAt: r.certificateIssuedAt,
      })),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load certificates." },
      { status: 500 }
    );
  }
}
