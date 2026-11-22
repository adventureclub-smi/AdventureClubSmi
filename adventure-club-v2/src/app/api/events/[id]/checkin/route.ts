import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

// Looks a registrant up by their short code or by (part of) their name —
// used by both the manual check-in search box and the QR-scan landing page
// (which passes ?code=).
export async function GET(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();
    const query = searchParams.get("query")?.trim();

    if (code) {
      const registration = await prisma.eventRegistration.findFirst({
        where: { trekId: eventId, shortCode: code },
        include: { user: { select: { fullName: true, clubId: true } } },
      });

      if (!registration) {
        return NextResponse.json({ message: "No registration with that code." }, { status: 404 });
      }

      return NextResponse.json({ registration });
    }

    if (query) {
      const registrations = await prisma.eventRegistration.findMany({
        where: { trekId: eventId },
        include: { user: { select: { fullName: true, clubId: true } } },
      });

      const lower = query.toLowerCase();
      // Guest rows have no `user` — fall back to the name/phone collected
      // on the spot.
      const matches = registrations.filter(
        (r) =>
          (r.user?.fullName ?? r.guestName ?? "").toLowerCase().includes(lower) ||
          (r.user?.clubId ?? r.guestPhone ?? "").toLowerCase().includes(lower) ||
          r.shortCode.includes(lower)
      );

      return NextResponse.json({ registrations: matches.slice(0, 15) });
    }

    return NextResponse.json({ message: "Pass ?code= or ?query=." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

// Marks one registration as checked in (or undoes it, if already marked —
// a core member fat-fingering the wrong row needs an easy way back).
export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId } = await context.params;
    const { registrationId, present } = await req.json();

    if (!registrationId) {
      return NextResponse.json({ message: "registrationId is required." }, { status: 400 });
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration || registration.trekId !== eventId) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }

    const markPresent = present !== false;

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        attendanceMarked: markPresent,
        attendanceMarkedAt: markPresent ? new Date() : null,
        attendanceMarkedBy: markPresent ? admin.fullName : null,
      },
      include: { user: { select: { fullName: true, clubId: true } } },
    });

    const displayName = updated.user?.fullName ?? updated.guestName ?? "Guest";

    return NextResponse.json({
      message: markPresent ? `${displayName} marked present.` : "Check-in undone.",
      registration: updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
