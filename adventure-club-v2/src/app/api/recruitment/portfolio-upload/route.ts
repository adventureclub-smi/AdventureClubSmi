import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { ImageProcessingError, uploadBuffer } from "@/lib/storage";

const MAX_SIZE_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ message: "File is too large — max 25MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploaded = await uploadBuffer(buffer, file.type, {
      folder: "AdventureClub/Recruitment/Portfolio",
    });

    return NextResponse.json({ url: uploaded.secure_url });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: error instanceof ImageProcessingError ? error.message : "Failed to upload file." },
      { status: 500 }
    );
  }
}
