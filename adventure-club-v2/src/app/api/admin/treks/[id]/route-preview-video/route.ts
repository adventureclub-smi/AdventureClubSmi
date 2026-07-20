import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";
import { compressVideo } from "@/lib/video-compress";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File) || !file.type.startsWith("video/")) {
      return NextResponse.json({ message: "A video file is required." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const compressed = await compressVideo(bytes);

    const uploaded = await uploadBuffer(compressed, "video/mp4", {
      folder: "AdventureClub/TrekRoutePreview",
      resourceType: "video",
    });

    const trek = await prisma.trek.update({
      where: { id },
      data: { routePreviewVideoUrl: uploaded.secure_url },
    });

    return NextResponse.json({ routePreviewVideoUrl: trek.routePreviewVideoUrl });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to save preview video." }, { status: 500 });
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

    await prisma.trek.update({
      where: { id },
      data: { routePreviewVideoUrl: null },
    });

    return NextResponse.json({ message: "Preview video removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to remove preview video." }, { status: 500 });
  }
}
