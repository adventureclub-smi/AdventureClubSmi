import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
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

    const stat = await prisma.homepageStat.update({
      where: { id },
      data: {
        label: label.trim(),
        value: numericValue,
        suffix: suffix?.trim() || null,
      },
    });

    return NextResponse.json(stat);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to update stat." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.homepageStat.delete({ where: { id } });

    return NextResponse.json({ message: "Stat removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to remove stat." }, { status: 500 });
  }
}
