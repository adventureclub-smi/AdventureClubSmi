import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const announcements = await prisma.tripAnnouncement.findMany({
      orderBy: { createdAt: "desc" },
      include: { trek: true },
      take: 50,
    });

    return NextResponse.json(
      announcements.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        trekId: a.trekId,
        trekTitle: a.trek.title,
        createdAt: a.createdAt,
      }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load announcements." },
      { status: 500 }
    );
  }
}
