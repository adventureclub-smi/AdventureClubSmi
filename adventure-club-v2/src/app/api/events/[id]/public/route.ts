import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { computeGroupStandings } from "@/lib/event-points-table";

type RouteContext = { params: Promise<{ id: string }> };

// Everything a student (or anyone, logged in or not) sees on an event's
// public page — teams, fixtures and the points table are visible to
// everyone once they exist, not just the people registered, since that
// visibility is itself part of keeping the random draw trustworthy.
export async function GET(req: Request, context: RouteContext) {
  try {
    const { id: eventId } = await context.params;

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";

    if (event.isTest || event.isDraft) {
      const isCoreTeamMember = !!user && isCoreTeamRole(user.clubRole);

      const allowedForTest =
        !event.isTest || isAdmin || (!!user && event.testVisibleToUserIds.includes(user.id));
      const allowedForDraft = !event.isDraft || isAdmin || isCoreTeamMember;

      if (!allowedForTest || !allowedForDraft) {
        return NextResponse.json({ message: "Event not found." }, { status: 404 });
      }
    }

    const [registeredCount, myRegistration, teams, groupMatches, knockoutMatches] =
      await Promise.all([
        prisma.eventRegistration.count({ where: { trekId: eventId } }),
        user
          ? prisma.eventRegistration.findFirst({ where: { trekId: eventId, userId: user.id } })
          : null,
        prisma.eventTeam.findMany({ where: { trekId: eventId } }),
        prisma.eventMatch.findMany({ where: { trekId: eventId, stage: "GROUP" } }),
        prisma.eventMatch.findMany({ where: { trekId: eventId, stage: "KNOCKOUT" }, orderBy: { id: "asc" } }),
      ]);

    let myTeam = null;
    if (myRegistration?.teamId) {
      const team = teams.find((t) => t.id === myRegistration.teamId);
      if (team) {
        const teammates = await prisma.eventRegistration.findMany({
          where: { teamId: team.id },
          include: { user: { select: { fullName: true } } },
        });
        myTeam = {
          id: team.id,
          name: team.name,
          colour: team.colour,
          members: teammates.map((t) => t.user?.fullName ?? t.guestName ?? "Guest"),
        };
      }
    }

    const standings = event.eventQualifiersCount
      ? computeGroupStandings(
          teams,
          groupMatches.map((m) => ({
            teamAId: m.teamAId,
            teamBId: m.teamBId ?? "",
            winnerTeamId: m.winnerTeamId,
            status: m.status,
            groupNumber: m.groupNumber,
          })),
          event.eventQualifiersCount,
          event.eventDrawSeed ?? ""
        )
      : [];

    return NextResponse.json({
      event,
      registeredCount,
      loggedIn: !!user,
      isRegistered: !!myRegistration,
      myShortCode: myRegistration?.shortCode ?? null,
      myAttendanceMarked: myRegistration?.attendanceMarked ?? false,
      myTeam,
      teams,
      groupMatches,
      knockoutMatches,
      standings,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
