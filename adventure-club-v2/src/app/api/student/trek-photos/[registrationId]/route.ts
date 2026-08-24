import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { ImageProcessingError, uploadBuffer } from "@/lib/storage";
import { ensureTrekFolder, uploadPhotoToDrive } from "@/lib/google-drive";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12MB — a raw phone photo, uncompressed

type RouteContext = {
  params: Promise<{ registrationId: string }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Please login first." }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ message: "Invalid session." }, { status: 401 });
    }

    const { registrationId } = await params;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { trek: true },
    });

    if (!registration) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }

    if (registration.userId !== payload.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Only someone who actually went can add photos — this is the same flag
    // the admin's Attendance tab sets, not just "registered."
    if (!registration.attendanceMarked) {
      return NextResponse.json(
        { message: "Trek photos open up once your attendance is marked for this trip." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const caption = (formData.get("caption") as string) || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Only image files are supported." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { message: "That photo is too large (over 12MB). Please choose a smaller one." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // The original, unmodified file is what actually lives in Drive — the
    // R2 copy below is a re-encoded, web-optimized stand-in used for display
    // only, so the two are deliberately not the same bytes.
    const folderId = await ensureTrekFolder(registration.trek.id, registration.trek.title);
    const driveFileId = await uploadPhotoToDrive(buffer, file.name, file.type, folderId);

    const uploaded = await uploadBuffer(buffer, file.type, {
      folder: "AdventureClub/TrekPhotos",
    });

    const photo = await prisma.trekPhoto.create({
      data: {
        trekId: registration.trek.id,
        uploadedByUserId: payload.id,
        driveFileId,
        displayUrl: uploaded.secure_url,
        width: uploaded.width,
        height: uploaded.height,
        caption,
      },
    });

    return NextResponse.json({ message: "Photo uploaded!", photo });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof ImageProcessingError
            ? error.message
            : error instanceof Error && error.message.includes("Google Drive")
            ? error.message
            : "Failed to upload photo.",
      },
      { status: 500 }
    );
  }
}
