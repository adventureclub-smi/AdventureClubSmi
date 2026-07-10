import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const stats = await prisma.trailStat.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(stats);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { label, value, tooltip } = await req.json();

    if (!label?.trim() || !value?.trim()) {
      return NextResponse.json(
        { message: "A label and value are required." },
        { status: 400 }
      );
    }

    const count = await prisma.trailStat.count();

    const stat = await prisma.trailStat.create({
      data: {
        label: label.trim(),
        value: value.trim(),
        tooltip: tooltip?.trim() || null,
        order: count,
      },
    });

    return NextResponse.json(stat, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to add trail stat." }, { status: 500 });
  }
}
