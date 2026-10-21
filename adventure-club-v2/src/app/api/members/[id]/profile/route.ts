import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getBadges, getPortfolioPoints } from "@/lib/portfolio";
import { RegistrationStatus } from "@prisma/client";

// Members-only profile card for the directory — shown when a member clicks
// another member's search result. Trek stats only go out when the target
// member has opted into statsPublic (or it's their own card); name, photo,
// role, year, and bio are visible to any logged-in member either way.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const viewer = await getCurrentUser();

  if (!viewer) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const member = await prisma.user.findUnique({
      where: { id, membershipStatus: "ACTIVE" },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        clubRole: true,
        year: true,
        bio: true,
        statsPublic: true,
      },
    });

    if (!member) {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }

    const canSeeStats = member.statsPublic || member.id === viewer.id;

    if (!canSeeStats) {
      return NextResponse.json({ ...member, stats: null });
    }

    const registrations = await prisma.registration.findMany({
      where: { userId: member.id, status: RegistrationStatus.COMPLETED },
      include: { trek: true, certificate: true },
    });

    const totals = {
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

      totals.totalKm += trek.distanceKm;
      totals.totalNights += trek.campNights;
      if (trek.countsAsPeak) totals.peaks++;
      if (trek.altitudeMeters > totals.highestAltitude) {
        totals.highestAltitude = trek.altitudeMeters;
      }
      if (registration.certificate) totals.certificates++;
    });

    const stats = {
      ...totals,
      portfolioPoints: getPortfolioPoints(totals),
      badgesEarned: getBadges(totals).filter((b) => b.achieved).length,
    };

    return NextResponse.json({ ...member, stats });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load member profile." },
      { status: 500 }
    );
  }
}
