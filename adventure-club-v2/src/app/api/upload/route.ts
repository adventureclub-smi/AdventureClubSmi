import { NextResponse } from "next/server";
import { uploadBuffer } from "@/lib/storage";
import { compressVideo } from "@/lib/video-compress";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded." },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith("video/");
    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);
    const buffer = isVideo ? await compressVideo(rawBuffer) : rawBuffer;

    const uploaded = await uploadBuffer(buffer, isVideo ? "video/mp4" : file.type, {
      folder: "AdventureClub/Treks",
      resourceType: isVideo ? "video" : "image",
    });

    return NextResponse.json({
      url: uploaded.secure_url,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Image upload failed.",
      },
      {
        status: 500,
      }
    );
  }
}