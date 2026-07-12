import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseIstDateTimeLocal } from "@/lib/ist-time";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const trek = await prisma.trek.findUnique({
      where: { id },
    });

    if (!trek) {
      return NextResponse.json(
        { message: "Trek not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(trek);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch trek." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: RouteContext
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    const body = await req.json();

    const trek = await prisma.trek.update({
      where: { id },
      data: {
        title: body.title,
        destination: body.destination,
        trailType: body.trailType,
        difficulty: body.difficulty,
        altitude: body.altitude,
        duration: body.duration,
        distance: body.distance,
        trekDay: body.trekDay,
        date: new Date(body.date),
        price: Number(body.price),
        initialPayment: Number(body.initialPayment),
        finalPayment: Number(body.finalPayment),
        seats: Number(body.seats),
        description: body.description,
        status: body.status,

        ...(body.coverImage ? { coverImage: body.coverImage } : {}),

        registrationOpensAt: parseIstDateTimeLocal(body.registrationOpensAt),

        registrationClosesAt: parseIstDateTimeLocal(body.registrationClosesAt),

        // Portfolio Automation
        distanceKm:
          body.distanceKm !== undefined ? Number(body.distanceKm) : undefined,

        altitudeMeters:
          body.altitudeMeters !== undefined ? Number(body.altitudeMeters) : undefined,

        campNights:
          body.campNights !== undefined ? Number(body.campNights) : undefined,

        countsAsPeak:
          body.countsAsPeak !== undefined ? Boolean(body.countsAsPeak) : undefined,

        // Map Location
        latitude:
          body.latitude !== undefined && body.latitude !== ""
            ? Number(body.latitude)
            : null,

        longitude:
          body.longitude !== undefined && body.longitude !== ""
            ? Number(body.longitude)
            : null,
      },
    });

    return NextResponse.json({
      message: "Trek updated successfully!",
      trek,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update trek." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    await prisma.trek.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Trek deleted successfully!",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to delete trek." },
      { status: 500 }
    );
  }
}