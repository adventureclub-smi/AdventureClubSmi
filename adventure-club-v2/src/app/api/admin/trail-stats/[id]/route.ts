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
    const { label, value, tooltip } = await req.json();

    if (!label?.trim() || !value?.trim()) {
      return NextResponse.json(
        { message: "A label and value are required." },
        { status: 400 }
      );
    }

    const stat = await prisma.trailStat.update({
      where: { id },
      data: {
        label: label.trim(),
        value: value.trim(),
        tooltip: tooltip?.trim() || null,
      },
    });

    return NextResponse.json(stat);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to update trail stat." }, { status: 500 });
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

    await prisma.trailStat.delete({ where: { id } });

    return NextResponse.json({ message: "Trail stat removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to remove trail stat." }, { status: 500 });
  }
}
