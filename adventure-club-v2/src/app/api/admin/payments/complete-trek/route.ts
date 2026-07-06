import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId, undo } = await req.json();

    if (!trekId) {
      return NextResponse.json({ message: "trekId is required." }, { status: 400 });
    }

    if (undo) {
      const [result] = await Promise.all([
        prisma.registration.updateMany({
          where: { trekId, status: { in: ["COMPLETED", "MISSED"] } },
          data: { status: "APPROVED" },
        }),

        // Re-list the trek as an upcoming trek on the public site.
        prisma.trek.update({
          where: { id: trekId },
          data: { status: "Registration Open" },
        }),
      ]);

      return NextResponse.json({
        message: `Trek completion undone for ${result.count} participant(s).`,
        undone: result.count,
      });
    }

    const registrations = await prisma.registration.findMany({
      where: { trekId, status: "APPROVED" },
      select: { id: true, attendanceMarked: true },
    });

    const presentIds = registrations.filter((r) => r.attendanceMarked).map((r) => r.id);
    const absentIds = registrations.filter((r) => !r.attendanceMarked).map((r) => r.id);

    await Promise.all([
      presentIds.length
        ? prisma.registration.updateMany({
            where: { id: { in: presentIds } },
            data: { status: "COMPLETED" },
          })
        : Promise.resolve(),

      absentIds.length
        ? prisma.registration.updateMany({
            where: { id: { in: absentIds } },
            data: { status: "MISSED" },
          })
        : Promise.resolve(),

      // Delist the trek from the public "Upcoming Treks" listings —
      // getUpcomingTreks() only shows treks with this exact status.
      prisma.trek.update({
        where: { id: trekId },
        data: { status: "Completed" },
      }),
    ]);

    return NextResponse.json({
      message: `Trek completed — ${presentIds.length} marked completed, ${absentIds.length} marked missed.`,
      completed: presentIds.length,
      missed: absentIds.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to complete trek." },
      { status: 500 }
    );
  }
}
