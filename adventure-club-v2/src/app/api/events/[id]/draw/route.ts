import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { runEventDraw } from "@/lib/event-draw";
import { mulberry32, seedToInt, generateLeagueSchedule, spaceOutFixtures } from "@/lib/event-groups";
import { seedInitialBracket } from "@/lib/event-bracket";

type RouteContext = { params: Promise<{ id: string }> };

// Runs (or re-runs, before anything's been played) the random team draw for
// a Campus Event — equally-sized teams, picked and coloured automatically —
// then generates its fixtures in the same request: for LEAGUE_KNOCKOUT,
// every team gets a random, capped set of opponents in one combined table
// (see event-groups.ts); for DIRECT_KNOCKOUT, the first knockout round is
// seeded directly — fixtures are a pure function of the drawn teams either
// way.
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

    if (event.eventTournamentStarted) {
      return NextResponse.json(
        { message: "Can't redraw teams once the tournament has started." },
        { status: 400 }
      );
    }

    if (!event.eventTeamSize || (event.eventFormat !== "DIRECT_KNOCKOUT" && !event.eventMatchesPerTeamCap)) {
      return NextResponse.json(
        { message: "Set the team size (and matches per team, for League + Knockout) in Tournament Settings first." },
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

    // Only people actually marked present on the day go into the draw — a
    // registration alone doesn't guarantee a show, and a team built out of
    // no-shows is useless on the field. Everyone else (registered but never
    // checked in) just stays off a team, same as before the draw ran.
    const presentRegistrations = await prisma.eventRegistration.findMany({
      where: { trekId: eventId, attendanceMarked: true },
    });

    if (presentRegistrations.length < 4) {
      return NextResponse.json(
        { message: "Need at least 4 checked-in (present) participants to form 2 teams." },
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
      registrations: presentRegistrations.map((r) => ({
        id: r.id,
        gender: r.gender,
        isCoreMember: r.isCoreMember,
      })),
      teamSize: event.eventTeamSize,
    });

    const createdTeams = [];

    for (const team of result.teams) {
      const created = await prisma.eventTeam.create({
        data: {
          trekId: eventId,
          name: team.name,
          colour: team.colour,
          targetSize: team.registrationIds.length,
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
      // One combined league table — every team plays a random, capped set
      // of opponents (not necessarily everyone), derived from the same
      // seed as the team draw so the whole thing is reproducible together.
      const schedule = spaceOutFixtures(
        generateLeagueSchedule(
          createdTeams.map((t) => t.id),
          event.eventMatchesPerTeamCap!,
          mulberry32(seedToInt(`${result.seed}:fixtures`))
        )
      );

      for (const pair of schedule) {
        await prisma.eventMatch.create({
          data: {
            trekId: eventId,
            stage: "GROUP",
            teamAId: pair.teamAId,
            teamBId: pair.teamBId,
          },
        });
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

// Undoes a test draw entirely — clears every team and fixture and puts the
// event back to "not drawn yet", rather than immediately drawing again like
// POST does. For when a draw was only ever for checking the setup and the
// admin wants a clean slate (e.g. more people registered since) without
// also generating a fresh set of fixtures in the same action.
export async function DELETE(req: Request, context: RouteContext) {
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

    if (event.eventTournamentStarted) {
      return NextResponse.json(
        { message: "Can't undo team allocation once the tournament has started." },
        { status: 400 }
      );
    }

    const anyMatchPlayed = await prisma.eventMatch.findFirst({
      where: { trekId: eventId, status: "COMPLETED" },
    });

    if (anyMatchPlayed) {
      return NextResponse.json(
        { message: "Team allocation can't be undone once a match has been played." },
        { status: 400 }
      );
    }

    await prisma.eventMatch.deleteMany({ where: { trekId: eventId } });
    await prisma.eventRegistration.updateMany({ where: { trekId: eventId }, data: { teamId: null } });
    await prisma.eventTeam.deleteMany({ where: { trekId: eventId } });
    await prisma.trek.update({
      where: { id: eventId },
      data: { eventTeamsDrawnAt: null, eventDrawSeed: null },
    });

    return NextResponse.json({ message: "Team allocation undone." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
