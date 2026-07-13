import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const songs = await prisma.song.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(songs);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const title = form.get("title") as string;
    const audioFile = form.get("audioFile");
    const thumbnailFile = form.get("thumbnailFile");

    if (!title?.trim()) {
      return NextResponse.json({ message: "Song name is required." }, { status: 400 });
    }

    if (!(audioFile instanceof File) || !(thumbnailFile instanceof File)) {
      return NextResponse.json(
        { message: "Both an MP3 file and a thumbnail image are required." },
        { status: 400 }
      );
    }

    const audioBytes = Buffer.from(await audioFile.arrayBuffer());

    const uploadedAudio = await uploadBuffer(audioBytes, audioFile.type, {
      folder: "AdventureClub/Songs",
      resourceType: "video", // not actually video — just means "skip image processing"
    });

    const thumbBytes = Buffer.from(await thumbnailFile.arrayBuffer());

    const uploadedThumb = await uploadBuffer(thumbBytes, thumbnailFile.type, {
      folder: "AdventureClub/Songs",
    });

    const count = await prisma.song.count();

    const song = await prisma.song.create({
      data: {
        title: title.trim(),
        audioUrl: uploadedAudio.secure_url,
        thumbnailUrl: uploadedThumb.secure_url,
        order: count,
        uploadedBy: admin.id,
      },
    });

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to upload song." },
      { status: 500 }
    );
  }
}
