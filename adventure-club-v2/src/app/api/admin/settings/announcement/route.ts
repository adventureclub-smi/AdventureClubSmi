import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const settings = await prisma.homepageAnnouncement.findFirst();

  return NextResponse.json(settings || { message: "", isActive: true });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { message, isActive } = await req.json();

    const data = {
      message: typeof message === "string" ? message.trim() : "",
      isActive: !!isActive,
    };

    const existing = await prisma.homepageAnnouncement.findFirst();

    const settings = existing
      ? await prisma.homepageAnnouncement.update({ where: { id: existing.id }, data })
      : await prisma.homepageAnnouncement.create({ data });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save announcement." },
      { status: 500 }
    );
  }
}
