import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

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

    await prisma.homepageGalleryPhoto.delete({ where: { id } });

    return NextResponse.json({ message: "Gallery photo removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to remove gallery photo." },
      { status: 500 }
    );
  }
}
