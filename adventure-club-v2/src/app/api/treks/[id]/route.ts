import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseIstDateTimeLocal } from "@/lib/ist-time";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const trek = await prisma.trek.findUnique({
      where: { id },
    });

    if (!trek) {
      return NextResponse.json(
        { message: "Trek not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(trek);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch trek." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: RouteContext
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    const body = await req.json();

    const existing = await prisma.trek.findUnique({
      where: { id },
      select: { registrationOpensAt: true },
    });

    const nextRegistrationOpensAt = parseIstDateTimeLocal(body.registrationOpensAt);

    // Rescheduling registrationOpensAt (e.g. pushing it out, or setting a new
    // one after it already passed) must re-arm the Notify Me email — once
    // set, registrationOpenNotifiedAt otherwise stays permanently "already
    // sent" even though the trek is now opening at a brand new time.
    const registrationOpensAtChanged =
      existing?.registrationOpensAt?.getTime() !== nextRegistrationOpensAt?.getTime();

    const installmentCount = Number(body.installments) === 1 ? 1 : 2;

    const trek = await prisma.trek.update({
      where: { id },
      data: {
        title: body.title,
        destination: body.destination,
        trailType: body.trailType,
        difficulty: body.difficulty,
        altitude: body.altitude,
        duration: body.duration,
        distance: body.distance,
        trekDay: body.trekDay,
        date: new Date(body.date),
        price: Number(body.price),
        installments: installmentCount,
        initialPayment: Number(body.initialPayment),
        finalPayment: installmentCount === 1 ? 0 : Number(body.finalPayment),
        seats: Number(body.seats),
        description: body.description,
        status: body.status,

        ...(body.coverImage ? { coverImage: body.coverImage } : {}),

        registrationOpensAt: nextRegistrationOpensAt,

        registrationClosesAt: parseIstDateTimeLocal(body.registrationClosesAt),

        ...(registrationOpensAtChanged ? { registrationOpenNotifiedAt: null } : {}),

        // Portfolio Automation
        distanceKm:
          body.distanceKm !== undefined ? Number(body.distanceKm) : undefined,

        altitudeMeters:
          body.altitudeMeters !== undefined ? Number(body.altitudeMeters) : undefined,

        campNights:
          body.campNights !== undefined ? Number(body.campNights) : undefined,

        countsAsPeak:
          body.countsAsPeak !== undefined ? Boolean(body.countsAsPeak) : undefined,

        // Map Location
        latitude:
          body.latitude !== undefined && body.latitude !== ""
            ? Number(body.latitude)
            : null,

        longitude:
          body.longitude !== undefined && body.longitude !== ""
            ? Number(body.longitude)
            : null,
      },
    });

    return NextResponse.json({
      message: "Trek updated successfully!",
      trek,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update trek." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    // Every one of these has a required (non-optional) relation back to
    // either this trek or one of its registrations, and MongoDB has no
    // native FK enforcement of its own — Prisma emulates that check at the
    // query-engine level regardless, so `trek.delete` fails outright the
    // moment a single registration (or payment, waypoint, etc.) still
    // points at this trek. Deleting every dependent first, deepest first,
    // is what actually lets a trek with real history be removed.
    const registrations = await prisma.registration.findMany({
      where: { trekId: id },
      select: { id: true },
    });
    const registrationIds = registrations.map((r) => r.id);

    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.refund.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.attendance.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.emergencyContact.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.certificate.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.registration.deleteMany({ where: { trekId: id } }),
      prisma.trekWaypoint.deleteMany({ where: { trekId: id } }),
      prisma.expense.deleteMany({ where: { trekId: id } }),
      prisma.income.deleteMany({ where: { trekId: id } }),
      prisma.gallery.deleteMany({ where: { trekId: id } }),
      prisma.tripAnnouncement.deleteMany({ where: { trekId: id } }),
      prisma.trekNotifyRequest.deleteMany({ where: { trekId: id } }),
      prisma.trek.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      message: "Trek deleted successfully!",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to delete trek." },
      { status: 500 }
    );
  }
}