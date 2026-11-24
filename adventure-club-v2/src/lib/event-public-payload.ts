import { prisma } from "@/lib/prisma";
import { computeGroupStandings } from "@/lib/event-points-table";
import type { Trek, User } from "@prisma/client";

// Everything a student (or anyone, logged in or not) sees once an event's
// tournament has actually started — teams, fixtures and the points table,
// plus the viewer's own registration/team if they have one. Shared by the
// event's own public page (/api/events/[id]/public) and the homepage's Live
// League section (/api/homepage/featured-event), so the two can never drift
// out of sync on what "started" means or how a team roster is built.
export async function buildEventPublicPayload(event: Trek, user: User | null) {
  const eventId = event.id;

  const [registeredCount, myRegistration, teams, groupMatches, knockoutMatches] = await Promise.all([
    prisma.eventRegistration.count({ where: { trekId: eventId } }),
    user
      ? prisma.eventRegistration.findFirst({ where: { trekId: eventId, userId: user.id } })
      : null,
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

  return {
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
  };
}
