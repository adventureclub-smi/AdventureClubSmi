import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { undoMatchResult } from "@/lib/event-match-undo";

type RouteContext = { params: Promise<{ id: string }> };

// Undoes every recorded result for this event in one action — for resetting
// a test run of the tournament instead of clicking Undo on each match one
// at a time. Reuses the exact same per-match undo (and its KNOCKOUT-round
// cascade) as the single Undo button, just repeated until nothing
// COMPLETED is left. Re-queries after every undo rather than undoing a
// list gathered up front, since undoing one KNOCKOUT match can delete later
// rounds outright — the COMPLETED set genuinely changes shape each time,
// not just shrinks by one. A bye is left alone either way, same as a
// single undo.
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

    let undone = 0;

    for (;;) {
      const next = await prisma.eventMatch.findFirst({
        where: { trekId: eventId, status: "COMPLETED", teamBId: { not: null } },
      });

      if (!next) break;

      const result = await undoMatchResult(eventId, next.id);
      if (!result.ok) break; // shouldn't happen given the query above — just avoids looping forever

      undone++;
    }

    return NextResponse.json({
      message: undone > 0 ? `Undid ${undone} result${undone === 1 ? "" : "s"}.` : "No results to undo.",
      undone,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
