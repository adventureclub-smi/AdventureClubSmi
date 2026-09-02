import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { trekId } = await params;

  const registrations = await prisma.registration.findMany({
    where: {
      trekId,
      OR: [{ initialPaymentPaid: true }, { offlinePaymentVerified: true }],
    },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const people = registrations.map((r) => ({
    registrationId: r.id,
    registrationNumber: r.registrationNumber,
    // baseName is the person's real name (account or guest); nameOverride is
    // a booking-only correction on top of it — the UI shows nameOverride ||
    // baseName and can clear the override to fall back to baseName.
    baseName: r.isGuest ? r.guestName || "Guest" : r.user?.fullName || "Unknown",
    nameOverride: r.bookingNameOverride,
    phoneNumber: r.isGuest ? r.guestPhoneNumber : r.user?.phoneNumber,
    isGuest: r.isGuest,
    govtIdType: r.user?.govtIdType ?? null,
    govtIdNumber: r.user?.govtIdNumber ?? null,
    govtIdImageUrl: r.user?.govtIdImageUrl ?? null,
    govtIdStatus: r.user?.govtIdStatus ?? "NOT_SUBMITTED",
    bookingAssignedTo: r.bookingAssignedTo,
  }));

  return NextResponse.json(people);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { registrationId, bookingAssignedTo, name, govtIdNumber } = await req.json();

  if (!registrationId) {
    return NextResponse.json(
      { message: "registrationId is required." },
      { status: 400 }
    );
  }

  // bookingAssignedTo is the only field this route always touches; name and
  // govtIdNumber are opt-in edits sent one at a time from the booking table.
  if (bookingAssignedTo !== undefined) {
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { bookingAssignedTo: bookingAssignedTo?.trim() || null },
    });

    return NextResponse.json(registration);
  }

  if (name !== undefined) {
    // Booking-only correction (e.g. spelling to match a govt ID) — never
    // touches the person's actual account name.
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { bookingNameOverride: name?.trim() || null },
    });

    return NextResponse.json(registration);
  }

  if (govtIdNumber !== undefined) {
    // This is a real correction to the person's govt ID, so it updates the
    // User record directly — it's the same PAN/Aadhaar number used
    // everywhere else, not a booking-only override.
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: { userId: true, isGuest: true },
    });

    if (!registration || registration.isGuest || !registration.userId) {
      return NextResponse.json(
        { message: "This registration has no linked account to update a govt ID on." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: registration.userId },
      data: { govtIdNumber: govtIdNumber?.trim() || null },
    });

    return NextResponse.json(user);
  }

  return NextResponse.json(
    { message: "Nothing to update — pass bookingAssignedTo, name, or govtIdNumber." },
    { status: 400 }
  );
}
