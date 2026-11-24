import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { buildEventPublicPayload } from "@/lib/event-public-payload";

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
    // Tournament" is clicked. This page never bypasses that for anyone.
    //
    // The TV display is different: it's an admin tool for previewing the
    // setup (fixtures, colours, layout) before the tournament is live, so
    // it asks for ?preview=1 — honoured only when the requester is also an
    // authenticated admin/core-team member, never for an anonymous visitor
    // who happens to open the same link.
    const url = new URL(req.url);
    const wantsPreview = url.searchParams.get("preview") === "1";
    const tournamentStarted = !!event.eventTournamentStarted;
    const canSeeTournament = tournamentStarted || (wantsPreview && (isAdmin || isCoreTeamMember));

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

    const payload = await buildEventPublicPayload(event, user);

    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
