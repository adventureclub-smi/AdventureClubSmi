import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trekId: string }>;
  }
) {
  const { trekId } = await params;

  const announcements =
    await prisma.tripAnnouncement.findMany({
      where: {
        trekId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return NextResponse.json(announcements);
}