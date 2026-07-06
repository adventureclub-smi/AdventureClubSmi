import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: {
      id,
    },
  });

  if (!trek) {
    return NextResponse.json(
      {
        message: "Trek not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(trek);
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json();

  const trek = await prisma.trek.update({
    where: {
      id,
    },

    data: {
      meetingPoint: body.meetingPoint,

      meetingTime: body.meetingTime
        ? new Date(body.meetingTime)
        : null,

      transportDetails: body.transportDetails,

      weatherNote: body.weatherNote,

      whatsappGroupLink: body.whatsappGroupLink,

      emergencyNumber: body.emergencyNumber,

      itinerary: body.itinerary,

      leaderMessage: body.leaderMessage,

      reportingInstructions:
        body.reportingInstructions,

      requiredItems: body.requiredItems,

      optionalItems: body.optionalItems,

      // NEW
      tripCentrePublished:
        body.tripCentrePublished,

      tripCentrePublishedAt:
        body.tripCentrePublished
          ? new Date()
          : null,
    },
  });

  return NextResponse.json(trek);
}