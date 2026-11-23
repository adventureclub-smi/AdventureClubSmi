import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { computeGroupStandings } from "@/lib/event-points-table";

type RouteContext = { params: Promise<{ id: string }> };

// Everything the admin event-management page needs, in one request — the
// page has five tabs (registrations, draw, fixtures, points table,
// bracket) that all read from the same handful of collections, so one
// consolidated fetch beats five separate round trips.
export async function GET(req: Request, context: RouteContext) {
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

    const [registrations, teams, matches] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: { trekId: eventId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              clubId: true,
              institution: true,
              department: true,
              year: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.eventTeam.findMany({
        where: { trekId: eventId },
        orderBy: { name: "asc" },
      }),
      prisma.eventMatch.findMany({
        where: { trekId: eventId },
        orderBy: { id: "asc" },
      }),
    ]);

    const groupMatches = matches.filter((m) => m.stage === "GROUP");
    const knockoutMatches = matches.filter((m) => m.stage === "KNOCKOUT");

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
      registrations,
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
