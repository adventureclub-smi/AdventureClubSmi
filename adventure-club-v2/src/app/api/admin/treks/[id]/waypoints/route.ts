import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const waypoints = await prisma.trekWaypoint.findMany({
    where: { trekId: id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(waypoints);
}

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
    const { label, description, latitude, longitude, mediaUrl, mediaType } = await req.json();

    if (!label?.trim() || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: "A label, latitude, and longitude are required." },
        { status: 400 }
      );
    }

    const count = await prisma.trekWaypoint.count({ where: { trekId: id } });

    const waypoint = await prisma.trekWaypoint.create({
      data: {
        trekId: id,
        label: label.trim(),
        description: description?.trim() || null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        mediaUrl: mediaUrl?.trim() || null,
        mediaType: mediaType === "video" ? "video" : "image",
        order: count,
      },
    });

    return NextResponse.json(waypoint, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to add waypoint." }, { status: 500 });
  }
}
