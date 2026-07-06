import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { RegistrationStatus } from "@prisma/client";
import { getBadges, getPortfolioPoints } from "@/lib/portfolio";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ message: "Invalid Session" }, { status: 401 });
    }

    const registrations = await prisma.registration.findMany({
      where: {
        userId: payload.id,
        status: RegistrationStatus.COMPLETED,
      },
      include: { trek: true },
      orderBy: { createdAt: "desc" },
    });

    const totals = {
      totalTreks: registrations.length,
      totalKm: 0,
      totalNights: 0,
      peaks: 0,
      highestAltitude: 0,
    };

    const treks = registrations
      .filter((r) => r.trek)
      .map((r) => {
        const trek = r.trek!;

        totals.totalKm += trek.distanceKm;
        totals.totalNights += trek.campNights;
        if (trek.countsAsPeak) totals.peaks++;
        if (trek.altitudeMeters > totals.highestAltitude) {
          totals.highestAltitude = trek.altitudeMeters;
        }

        return {
          id: trek.id,
          title: trek.title,
          destination: trek.destination,
          date: trek.date,
          distanceKm: trek.distanceKm,
          altitudeMeters: trek.altitudeMeters,
          campNights: trek.campNights,
          countsAsPeak: trek.countsAsPeak,
        };
      });

    return NextResponse.json({
      totals,
      badges: getBadges(totals),
      points: getPortfolioPoints(totals),
      treks,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load portfolio." },
      { status: 500 }
    );
  }
}
