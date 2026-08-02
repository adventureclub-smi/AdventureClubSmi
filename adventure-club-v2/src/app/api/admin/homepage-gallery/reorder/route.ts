import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
      return NextResponse.json({ message: "ids must be a string array." }, { status: 400 });
    }

    await prisma.$transaction(
      ids.map((id: string, index: number) =>
        prisma.homepageGalleryPhoto.update({ where: { id }, data: { order: index } })
      )
    );

    return NextResponse.json({ message: "Order updated." });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to reorder gallery." }, { status: 500 });
  }
}
