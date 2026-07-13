import { NextResponse } from "next/server";
import { uploadBuffer } from "@/lib/storage";

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

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    const uploaded = await uploadBuffer(buffer, file.type, {
      folder: "AdventureClub/Treks",
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