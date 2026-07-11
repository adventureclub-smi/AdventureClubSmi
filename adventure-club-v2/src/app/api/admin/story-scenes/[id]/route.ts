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
    const { caption } = await req.json();

    const scene = await prisma.homepageStoryScene.update({
      where: { id },
      data: { caption: caption?.trim() || null },
    });

    return NextResponse.json(scene);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update scene." },
      { status: 500 }
    );
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

    await prisma.homepageStoryScene.delete({ where: { id } });

    return NextResponse.json({ message: "Scene removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to remove scene." },
      { status: 500 }
    );
  }
}
