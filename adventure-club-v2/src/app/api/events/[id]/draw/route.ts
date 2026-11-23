import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { runEventDraw } from "@/lib/event-draw";
import { seedInitialBracket } from "@/lib/event-bracket";

type RouteContext = { params: Promise<{ id: string }> };

// Runs (or re-runs, before anything's been played) the random team draw for
// a Campus Event — equally-sized teams, picked and coloured automatically —
// then generates its fixtures in the same request: group-stage round robins
// for LEAGUE_KNOCKOUT, or the first knockout round directly for
// DIRECT_KNOCKOUT, since fixtures are a pure function of the drawn teams.
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

    if (!event.eventTeamSize || (event.eventFormat !== "DIRECT_KNOCKOUT" && !event.eventMatchesPerTeamCap)) {
      return NextResponse.json(
        { message: "Set the team size (and match cap, for League + Knockout) in Tournament Settings first." },
        { status: 400 }
      );
    }

    const anyMatchPlayed = await prisma.eventMatch.findFirst({
      where: { trekId: eventId, status: "COMPLETED" },
    });

    if (anyMatchPlayed) {
      return NextResponse.json(
        { message: "Teams can't be redrawn once a match has been played." },
        { status: 400 }
      );
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { trekId: eventId },
    });

    if (registrations.length < 4) {
      return NextResponse.json(
        { message: "Need at least 4 registered participants to form 2 teams." },
        { status: 400 }
      );
    }

    // A previous (unplayed) draw left teams/matches behind — clear them
    // before drawing again so this stays idempotent rather than piling up
    // duplicate teams.
    await prisma.eventMatch.deleteMany({ where: { trekId: eventId } });
    await prisma.eventRegistration.updateMany({
      where: { trekId: eventId },
      data: { teamId: null },
    });
    await prisma.eventTeam.deleteMany({ where: { trekId: eventId } });

    const result = runEventDraw({
      registrationIds: registrations.map((r) => r.id),
      teamSize: event.eventTeamSize,
      matchesPerTeamCap: event.eventMatchesPerTeamCap ?? registrations.length,
    });

    const createdTeams = [];

    for (const team of result.teams) {
      const created = await prisma.eventTeam.create({
        data: {
          trekId: eventId,
          name: team.name,
          colour: team.colour,
          targetSize: team.registrationIds.length,
          groupNumber: team.groupNumber,
        },
      });

      await prisma.eventRegistration.updateMany({
        where: { id: { in: team.registrationIds } },
        data: { teamId: created.id },
      });

      createdTeams.push(created);
    }

    if (event.eventFormat === "DIRECT_KNOCKOUT") {
      const qualifiers = createdTeams.map((team, i) => ({ teamId: team.id, seed: i + 1 }));
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
    } else {
      // Round-robin fixtures within each group — every team plays every
      // other team in its own group exactly once.
      const groupNumbers = Array.from(new Set(createdTeams.map((t) => t.groupNumber)));

      for (const groupNumber of groupNumbers) {
        const teamsInGroup = createdTeams.filter((t) => t.groupNumber === groupNumber);

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
    }

    await prisma.trek.update({
      where: { id: eventId },
      data: { eventTeamsDrawnAt: new Date(), eventDrawSeed: result.seed },
    });

    return NextResponse.json({
      message: "Teams drawn and fixtures generated.",
      teams: createdTeams.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
