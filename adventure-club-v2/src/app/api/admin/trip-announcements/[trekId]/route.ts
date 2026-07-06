import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trekId: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

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

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trekId: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { trekId } = await params;

  const body = await req.json();

  const announcement =
    await prisma.tripAnnouncement.create({
      data: {
        trekId,
        title: body.title,
        message: body.message,
      },
    });

  return NextResponse.json(announcement);
}