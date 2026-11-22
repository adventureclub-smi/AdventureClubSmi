import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { getCurrentUser } from "@/lib/current-user";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { parseIstDateTimeLocal } from "@/lib/ist-time";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const event = await prisma.trek.findUnique({ where: { id } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    // Same test/draft visibility rules as /api/treks/[id].
    if (event.isTest || event.isDraft) {
      const user = await getCurrentUser();
      const isAdmin = user?.role === "admin";

      const allowedForTest =
        !event.isTest || isAdmin || (!!user && event.testVisibleToUserIds.includes(user.id));

      const allowedForDraft =
        !event.isDraft || isAdmin || (!!user && isCoreTeamRole(user.clubRole));

      if (!allowedForTest || !allowedForDraft) {
        return NextResponse.json({ message: "Event not found." }, { status: 404 });
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.trek.findUnique({ where: { id } });

    if (!existing || existing.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

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
      eventFormat,
      registrationOpensAt,
      registrationClosesAt,
      isTest,
      testVisibleToUserIds,
    } = body;

    const format = eventFormat === "DIRECT_KNOCKOUT" ? "DIRECT_KNOCKOUT" : "LEAGUE_KNOCKOUT";
    const qualifiersCountNum = Number(qualifiersCount);

    if (format === "LEAGUE_KNOCKOUT" && ![4, 6].includes(qualifiersCountNum)) {
      return NextResponse.json(
        { message: "Qualifier count must be 4 or 6." },
        { status: 400 }
      );
    }

    // Format can only still be changed before teams are locked — after
    // that, fixtures already exist for whichever format was used.
    if (existing.eventTeamsDrawnAt && format !== existing.eventFormat) {
      return NextResponse.json(
        { message: "Can't change tournament format once teams are locked." },
        { status: 400 }
      );
    }

    const event = await prisma.trek.update({
      where: { id },
      data: {
        title,
        destination: venue,
        date: new Date(date),
        description,
        coverImage: coverImage || null,
        seats: maxParticipants ? Number(maxParticipants) : 99999,

        eventTeamSize: teamSize ? Number(teamSize) : null,
        eventQualifiersCount: format === "LEAGUE_KNOCKOUT" ? qualifiersCountNum : null,
        eventMatchesPerTeamCap: format === "LEAGUE_KNOCKOUT" ? Number(matchesPerTeamCap) : null,
        eventFormat: format,

        registrationOpensAt: parseIstDateTimeLocal(registrationOpensAt),
        registrationClosesAt: parseIstDateTimeLocal(registrationClosesAt),

        isTest: Boolean(isTest),
        testVisibleToUserIds: isTest && Array.isArray(testVisibleToUserIds) ? testVisibleToUserIds : [],
      },
    });

    return NextResponse.json({ message: "Event updated.", event });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
