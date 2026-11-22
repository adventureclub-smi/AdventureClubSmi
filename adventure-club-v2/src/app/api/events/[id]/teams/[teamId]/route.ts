import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string; teamId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId, teamId } = await context.params;
    const { name, colour, targetSize } = await req.json();

    const team = await prisma.eventTeam.findUnique({ where: { id: teamId } });
    if (!team || team.trekId !== eventId) {
      return NextResponse.json({ message: "Team not found." }, { status: 404 });
    }

    const event = await prisma.trek.findUnique({ where: { id: eventId } });
    if (event?.eventTeamsDrawnAt) {
      return NextResponse.json(
        { message: "Teams are already locked for this event." },
        { status: 400 }
      );
    }

    const updated = await prisma.eventTeam.update({
      where: { id: teamId },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(colour !== undefined ? { colour: String(colour).trim() } : {}),
        ...(targetSize !== undefined ? { targetSize: Number(targetSize) } : {}),
      },
    });

    return NextResponse.json({ message: "Team updated.", team: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

// Only safe to delete a team nobody has been recorded onto yet — otherwise
// deleting it would silently strand those participants' allocation.
export async function DELETE(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId, teamId } = await context.params;

    const team = await prisma.eventTeam.findUnique({ where: { id: teamId } });
    if (!team || team.trekId !== eventId) {
      return NextResponse.json({ message: "Team not found." }, { status: 404 });
    }

    const assignedCount = await prisma.eventRegistration.count({ where: { teamId } });
    if (assignedCount > 0) {
      return NextResponse.json(
        { message: "Unassign everyone recorded on this team before deleting it." },
        { status: 400 }
      );
    }

    await prisma.eventTeam.delete({ where: { id: teamId } });

    return NextResponse.json({ message: "Team deleted." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
