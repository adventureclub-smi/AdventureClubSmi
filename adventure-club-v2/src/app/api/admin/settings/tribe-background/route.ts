import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";
import { compressVideo } from "@/lib/video-compress";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const settings = await prisma.tribeBackgroundSettings.findFirst();

  return NextResponse.json(settings || { mediaUrl: null, mediaType: null });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "A file is required." }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { message: "Please upload an image or video file." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    let uploaded;

    if (isVideo) {
      const compressed = await compressVideo(bytes);
      uploaded = await uploadBuffer(compressed, "video/mp4", {
        folder: "AdventureClub/TribeBackground",
        resourceType: "video",
      });
    } else {
      // Full-bleed background, so a slightly higher ceiling than a profile
      // photo — still a big cut from a raw phone-camera original.
      uploaded = await uploadBuffer(bytes, file.type, {
        folder: "AdventureClub/TribeBackground",
        maxSizeKB: 700,
      });
    }

    const existing = await prisma.tribeBackgroundSettings.findFirst();

    const data = {
      mediaUrl: uploaded.secure_url,
      mediaType: isVideo ? "VIDEO" : "IMAGE",
    };

    const settings = existing
      ? await prisma.tribeBackgroundSettings.update({ where: { id: existing.id }, data })
      : await prisma.tribeBackgroundSettings.create({ data });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save background." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const existing = await prisma.tribeBackgroundSettings.findFirst();

  if (existing) {
    await prisma.tribeBackgroundSettings.update({
      where: { id: existing.id },
      data: { mediaUrl: null, mediaType: null },
    });
  }

  return NextResponse.json({ message: "Background removed." });
}
