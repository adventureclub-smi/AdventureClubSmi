import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { deletePhotoFromDrive } from "@/lib/google-drive";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = {
  params: Promise<{ photoId: string }>;
};

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ message: "Please login first." }, { status: 401 });
    }

    const { photoId } = await params;

    const photo = await prisma.trekPhoto.findUnique({ where: { id: photoId } });

    if (!photo) {
      return NextResponse.json({ message: "Photo not found." }, { status: 404 });
    }

    // A student can remove their own upload; an admin can remove anyone's
    // (moderation) — matches the same override pattern used elsewhere.
    if (photo.uploadedByUserId !== payload.id) {
      const admin = await requireAdmin();

      if (!admin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
    }

    try {
      await deletePhotoFromDrive(photo.driveFileId);
    } catch (driveError) {
      // The Drive file may already be gone (manually deleted, etc.) — that
      // shouldn't block removing it from the site.
      console.error("Failed to delete Drive file:", driveError);
    }

    await prisma.trekPhoto.delete({ where: { id: photoId } });

    return NextResponse.json({ message: "Photo removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to remove photo." }, { status: 500 });
  }
}
