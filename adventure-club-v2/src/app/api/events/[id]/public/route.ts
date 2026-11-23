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
    const isCoreTeamMember = !!user && isCoreTeamRole(user.clubRole);

    if (event.isTest || event.isDraft) {
      const allowedForTest =
        !event.isTest || isAdmin || (!!user && event.testVisibleToUserIds.includes(user.id));
      const allowedForDraft = !event.isDraft || isAdmin || isCoreTeamMember;

      if (!allowedForTest || !allowedForDraft) {
        return NextResponse.json({ message: "Event not found." }, { status: 404 });
      }
    }

    const [registeredCount, myRegistration] = await Promise.all([
      prisma.eventRegistration.count({ where: { trekId: eventId } }),
      user
        ? prisma.eventRegistration.findFirst({ where: { trekId: eventId, userId: user.id } })
        : null,
    ]);

    // The admin can draw teams, play with fixtures and record results
    // freely to test the tournament setup before the real thing starts —
    // none of that (teams, fixtures, standings) shows up on this public
    // page for anyone, admin included, until "Close Registrations & Start
    // Tournament" is clicked. Admin testing happens through the admin
    // panel's own (always-authenticated) overview endpoint, not by an
    // admin bypass here — this page should show exactly what every other
    // visitor sees, with no exceptions.
    const tournamentStarted = !!event.eventTournamentStarted;
    const canSeeTournament = tournamentStarted;

    if (!canSeeTournament) {
      return NextResponse.json({
        event,
        registeredCount,
        loggedIn: !!user,
        isRegistered: !!myRegistration,
        myShortCode: myRegistration?.shortCode ?? null,
        myAttendanceMarked: myRegistration?.attendanceMarked ?? false,
        myTeam: null,
        teams: [],
        groupMatches: [],
        knockoutMatches: [],
        standings: [],
        tournamentStarted: false,
      });
    }

    const [teams, groupMatches, knockoutMatches] = await Promise.all([
      prisma.eventTeam.findMany({ where: { trekId: eventId } }),
      prisma.eventMatch.findMany({ where: { trekId: eventId, stage: "GROUP" }, orderBy: { id: "asc" } }),
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

    // Every team's roster, by name — shown on the public Teams view and the
    // TV display, not just the logged-in visitor's own team (myTeam above).
    const allRegistrations = await prisma.eventRegistration.findMany({
      where: { trekId: eventId, teamId: { not: null } },
      include: { user: { select: { fullName: true } } },
    });

    const rosterByTeam = new Map<string, string[]>();
    for (const r of allRegistrations) {
      const name = r.user?.fullName ?? r.guestName ?? "Guest";
      const list = rosterByTeam.get(r.teamId!) ?? [];
      list.push(name);
      rosterByTeam.set(r.teamId!, list);
    }

    const teamsWithRosters = teams.map((t) => ({ ...t, members: rosterByTeam.get(t.id) ?? [] }));

    const standings =
      groupMatches.length > 0
        ? computeGroupStandings(
            teams,
            groupMatches.map((m) => ({
              teamAId: m.teamAId,
              teamBId: m.teamBId ?? "",
              winnerTeamId: m.winnerTeamId,
              status: m.status,
              groupNumber: m.groupNumber,
            })),
            event.eventQualifiersCount ?? 4,
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
      teams: teamsWithRosters,
      groupMatches,
      knockoutMatches,
      standings,
      tournamentStarted: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
