import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const settings = await prisma.googleEarthSettings.findFirst();

  return NextResponse.json(settings || { earthUrl: "" });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { earthUrl } = await req.json();

    if (!earthUrl?.trim()) {
      return NextResponse.json({ message: "A Google Earth link is required." }, { status: 400 });
    }

    const data = { earthUrl: earthUrl.trim() };

    const existing = await prisma.googleEarthSettings.findFirst();

    const settings = existing
      ? await prisma.googleEarthSettings.update({ where: { id: existing.id }, data })
      : await prisma.googleEarthSettings.create({ data });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save Google Earth settings." },
      { status: 500 }
    );
  }
}
