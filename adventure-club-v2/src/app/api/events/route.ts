import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { getCurrentUser } from "@/lib/current-user";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { parseIstDateTimeLocal } from "@/lib/ist-time";

// Campus Events (Tug of War, etc.) are a Trek row with type: "EVENT" — same
// placeholder-field convention /api/workshops uses for type: "WORKSHOP", so
// every field that's meaningless here (trailType, difficulty, altitude,
// price...) just gets a harmless constant.
export async function POST(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const {
      title,
      venue,
      date,
      description,
      coverImage,
      maxParticipants,
      teamSize,
      qualifiersCount,
      matchesPerTeamCap,
      balanceGender,
      registrationOpensAt,
      registrationClosesAt,
      isTest,
      testVisibleToUserIds,
    } = body;

    const teamSizeNum = Number(teamSize);
    const qualifiersCountNum = Number(qualifiersCount);
    const matchesPerTeamCapNum = Number(matchesPerTeamCap);

    if (
      !title ||
      !venue ||
      !date ||
      !description ||
      !teamSizeNum ||
      teamSizeNum < 2 ||
      ![4, 6].includes(qualifiersCountNum) ||
      !matchesPerTeamCapNum ||
      matchesPerTeamCapNum < 2
    ) {
      return NextResponse.json(
        { message: "Please fill all fields." },
        { status: 400 }
      );
    }

    const event = await prisma.trek.create({
      data: {
        type: "EVENT",

        title,
        destination: venue,

        // Placeholder values — these fields only matter for treks/workshops
        // and are never shown for a campus event, but the schema still
        // requires *some* string since they're shared with the Trek model.
        trailType: "Event",
        difficulty: "N/A",
        altitude: "N/A",
        duration: "N/A",
        distance: "N/A",
        trekDay: "N/A",

        date: new Date(date),

        // Always free — this is a fun on-campus event, not a paid trip.
        price: 0,
        installments: 1,
        initialPayment: 0,
        finalPayment: 0,

        // An admin can optionally cap how many can register; left blank,
        // there's effectively no cap.
        seats: maxParticipants ? Number(maxParticipants) : 99999,

        description,
        coverImage: coverImage || null,

        eventTeamSize: teamSizeNum,
        eventQualifiersCount: qualifiersCountNum,
        eventMatchesPerTeamCap: matchesPerTeamCapNum,
        eventBalanceGender: balanceGender !== false,

        registrationOpensAt: parseIstDateTimeLocal(registrationOpensAt),
        registrationClosesAt: parseIstDateTimeLocal(registrationClosesAt),
        registrationOpenedManually: false,
        registrationClosedManually: false,

        distanceKm: 0,
        altitudeMeters: 0,
        campNights: 0,
        countsAsPeak: false,

        isTest: Boolean(isTest),
        testVisibleToUserIds: isTest && Array.isArray(testVisibleToUserIds) ? testVisibleToUserIds : [],

        // Same convention as every other Trek — never a client-chosen
        // option. "Go Live" flips this and sends the announcement email.
        isDraft: true,
      },
    });

    return NextResponse.json(
      { message: "Event created successfully!", event },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season");

    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";
    const isCoreTeamMember = !!user && isCoreTeamRole(user.clubRole);

    const events = await prisma.trek.findMany({
      where: {
        type: "EVENT",
        ...(season ? { isHistorical: true, season } : { isHistorical: false }),
        ...(isAdmin ? {} : { isTest: false }),
        ...(isAdmin || isCoreTeamMember ? {} : { isDraft: false }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch events." },
      { status: 500 }
    );
  }
}
