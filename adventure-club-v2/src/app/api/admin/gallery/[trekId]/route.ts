import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { trekId } = await params;

  const images = await prisma.gallery.findMany({
    where: { trekId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(images);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { trekId } = await params;
  const { imageUrl } = await req.json();

  if (!imageUrl) {
    return NextResponse.json({ message: "imageUrl is required." }, { status: 400 });
  }

  const image = await prisma.gallery.create({
    data: {
      trekId,
      imageUrl,
      uploadedBy: admin.id,
    },
  });

  return NextResponse.json(image, { status: 201 });
}
