import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const stats = await prisma.homepageStat.findMany({
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
    const { label, value, suffix } = await req.json();

    if (!label?.trim() || value === undefined || value === null || value === "") {
      return NextResponse.json(
        { message: "A label and value are required." },
        { status: 400 }
      );
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return NextResponse.json({ message: "Value must be a number." }, { status: 400 });
    }

    const count = await prisma.homepageStat.count();

    const stat = await prisma.homepageStat.create({
      data: {
        label: label.trim(),
        value: numericValue,
        suffix: suffix?.trim() || null,
        order: count,
      },
    });

    return NextResponse.json(stat, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to add stat." }, { status: 500 });
  }
}
