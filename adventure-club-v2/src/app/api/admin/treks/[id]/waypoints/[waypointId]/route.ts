import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; waypointId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { waypointId } = await params;
    const { label, description, latitude, longitude, mediaUrl, mediaType } = await req.json();

    if (!label?.trim() || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: "A label, latitude, and longitude are required." },
        { status: 400 }
      );
    }

    const waypoint = await prisma.trekWaypoint.update({
      where: { id: waypointId },
      data: {
        label: label.trim(),
        description: description?.trim() || null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        mediaUrl: mediaUrl?.trim() || null,
        mediaType: mediaType === "video" ? "video" : "image",
      },
    });

    return NextResponse.json(waypoint);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to update waypoint." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; waypointId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { waypointId } = await params;

    await prisma.trekWaypoint.delete({ where: { id: waypointId } });

    return NextResponse.json({ message: "Waypoint removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to remove waypoint." }, { status: 500 });
  }
}
