import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { splitIntoGroups } from "@/lib/event-groups";
import { seedInitialBracket } from "@/lib/event-bracket";

type RouteContext = { params: Promise<{ id: string }> };

// Finalises the physically-recorded team allocation: no more registration,
// no more re-assigning anyone's team, and fixtures get generated from
// whatever's been recorded. Branches on eventFormat, decided by the admin
// once attendance/team count is known:
// - LEAGUE_KNOCKOUT: split teams into groups, round-robin within each.
// - DIRECT_KNOCKOUT: seed every team straight into the first knockout round.
export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    if (event.eventTeamsDrawnAt) {
      return NextResponse.json({ message: "Teams are already locked." }, { status: 400 });
    }

    const teams = await prisma.eventTeam.findMany({
      where: { trekId: eventId },
      orderBy: { createdAt: "asc" },
    });

    if (teams.length < 2) {
      return NextResponse.json(
        { message: "Create at least 2 teams before locking." },
        { status: 400 }
      );
    }

    const unassignedCount = await prisma.eventRegistration.count({
      where: { trekId: eventId, teamId: null },
    });

    if (unassignedCount > 0) {
      return NextResponse.json(
        {
          message: `${unassignedCount} registered participant(s) still have no recorded team allocation.`,
        },
        { status: 400 }
      );
    }

    const seed = `${Date.now()}-${Math.random()}`;

    if (event.eventFormat === "DIRECT_KNOCKOUT") {
      const qualifiers = teams.map((team, i) => ({ teamId: team.id, seed: i + 1 }));
      const { roundName, slots } = seedInitialBracket(qualifiers);

      for (const slot of slots) {
        if (slot.type === "bye") {
          await prisma.eventMatch.create({
            data: {
              trekId: eventId,
              stage: "KNOCKOUT",
              round: roundName,
              teamAId: slot.teamId,
              teamBId: null,
              winnerTeamId: slot.teamId,
              status: "COMPLETED",
            },
          });
        } else {
          await prisma.eventMatch.create({
            data: {
              trekId: eventId,
              stage: "KNOCKOUT",
              round: roundName,
              teamAId: slot.teamAId,
              teamBId: slot.teamBId,
            },
          });
        }
      }

      await prisma.trek.update({
        where: { id: eventId },
        data: { eventTeamsDrawnAt: new Date(), eventDrawSeed: seed },
      });

      return NextResponse.json({
        message: `Teams locked. ${roundName} bracket generated directly — no group stage.`,
      });
    }

    // LEAGUE_KNOCKOUT (default)
    const matchesPerTeamCap = event.eventMatchesPerTeamCap ?? teams.length - 1;
    const groupNumbers = splitIntoGroups(teams.length, matchesPerTeamCap);
    const numGroups = new Set(groupNumbers).size;

    for (let i = 0; i < teams.length; i++) {
      await prisma.eventTeam.update({
        where: { id: teams[i].id },
        data: { groupNumber: numGroups > 1 ? groupNumbers[i] : null },
      });
    }

    const teamsWithGroups = teams.map((t, i) => ({
      ...t,
      groupNumber: numGroups > 1 ? groupNumbers[i] : null,
    }));

    for (const groupNumber of new Set(teamsWithGroups.map((t) => t.groupNumber))) {
      const teamsInGroup = teamsWithGroups.filter((t) => t.groupNumber === groupNumber);

      for (let i = 0; i < teamsInGroup.length; i++) {
        for (let j = i + 1; j < teamsInGroup.length; j++) {
          await prisma.eventMatch.create({
            data: {
              trekId: eventId,
              stage: "GROUP",
              groupNumber,
              teamAId: teamsInGroup[i].id,
              teamBId: teamsInGroup[j].id,
            },
          });
        }
      }
    }

    await prisma.trek.update({
      where: { id: eventId },
      data: { eventTeamsDrawnAt: new Date(), eventDrawSeed: seed },
    });

    return NextResponse.json({
      message: `Teams locked. Group-stage fixtures generated across ${numGroups} group(s).`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
