import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { RegistrationStatus } from "@prisma/client";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          message: "Invalid Session",
        },
        {
          status: 401,
        }
      );
    }

    const registrations =
      await prisma.registration.findMany({
        where: {
          userId: payload.id,
          status: RegistrationStatus.COMPLETED,
        },
        include: {
          trek: true,
          certificate: true,
        },
      });

    const stats = {
      totalTreks: registrations.length,

      peaks: 0,

      totalKm: 0,

      totalNights: 0,

      certificates: 0,

      highestAltitude: 0,
    };

    registrations.forEach((registration) => {
      const trek = registration.trek;

      if (!trek) return;

      stats.totalKm += trek.distanceKm;

      stats.totalNights += trek.campNights;

      if (trek.countsAsPeak) {
        stats.peaks++;
      }

      if (
        trek.altitudeMeters >
        stats.highestAltitude
      ) {
        stats.highestAltitude =
          trek.altitudeMeters;
      }

      if (registration.certificate) {
        stats.certificates++;
      }
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to load dashboard stats.",
      },
      {
        status: 500,
      }
    );
  }
}