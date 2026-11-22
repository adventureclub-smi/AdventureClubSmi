import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

// Teams are never decided by this site — the admin creates one row per
// physical team (name, colour, how many chits to print) once attendance is
// known, then records each participant's chit result separately via
// /teams/assign. This route is just that setup step's CRUD.
export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;
    const { name, colour, targetSize } = await req.json();

    if (!name?.trim() || !colour?.trim()) {
      return NextResponse.json({ message: "Name and colour are required." }, { status: 400 });
    }

    const event = await prisma.trek.findUnique({ where: { id: eventId } });

    if (!event || event.type !== "EVENT") {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    if (event.eventTeamsDrawnAt) {
      return NextResponse.json(
        { message: "Teams are already locked for this event." },
        { status: 400 }
      );
    }

    const team = await prisma.eventTeam.create({
      data: {
        trekId: eventId,
        name: name.trim(),
        colour: colour.trim(),
        targetSize: targetSize ? Number(targetSize) : 0,
      },
    });

    return NextResponse.json({ message: "Team created.", team });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
