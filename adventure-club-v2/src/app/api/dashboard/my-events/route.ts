import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// The student dashboard's own awareness of Campus Events — separate from
// /api/my-registrations (which only ever knew about Registration/Trek),
// since event sign-ups live in EventRegistration instead. Only ever
// upcoming events, soonest first, so this doesn't grow forever once past
// events pile up.
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Please login first." }, { status: 401 });
  }

  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: user.id, trek: { date: { gte: new Date() } } },
      include: { trek: true, team: true },
      orderBy: { trek: { date: "asc" } },
    });

    const entries = registrations.map((r) => ({
      eventId: r.trekId,
      title: r.trek.title,
      destination: r.trek.destination,
      date: r.trek.date,
      shortCode: r.shortCode,
      teamName: r.team?.name ?? null,
      teamColour: r.team?.colour ?? null,
      teamsDrawnAt: r.trek.eventTeamsDrawnAt,
      attendanceMarked: r.attendanceMarked,
    }));

    return NextResponse.json(entries);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch events." }, { status: 500 });
  }
}
