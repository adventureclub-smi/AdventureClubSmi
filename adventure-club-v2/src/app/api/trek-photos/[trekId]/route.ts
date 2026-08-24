import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ trekId: string }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  try {
    // Logged-in club members only — these are photos of/by students, not
    // meant to be indexable on the open internet.
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ message: "Please login first." }, { status: 401 });
    }

    const { trekId } = await params;

    const photos = await prisma.trekPhoto.findMany({
      where: { trekId },
      include: { uploadedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      photos.map((photo) => ({
        id: photo.id,
        src: photo.displayUrl,
        width: photo.width ?? 1200,
        height: photo.height ?? 900,
        caption: photo.caption,
        uploadedByName: photo.uploadedBy.fullName,
        isOwn: photo.uploadedByUserId === payload.id,
        createdAt: photo.createdAt,
      }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to load trek photos." }, { status: 500 });
  }
}
