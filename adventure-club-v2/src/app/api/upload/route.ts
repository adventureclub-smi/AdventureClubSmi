import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

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

    const base64 = `data:${file.type};base64,${buffer.toString(
      "base64"
    )}`;

    const uploaded = await cloudinary.uploader.upload(
      base64,
      {
        folder: "AdventureClub/Treks",
      }
    );

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