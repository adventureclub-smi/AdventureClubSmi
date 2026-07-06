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
    name: r.isGuest ? r.guestName || "Guest" : r.user?.fullName || "Unknown",
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

  const { registrationId, bookingAssignedTo } = await req.json();

  if (!registrationId) {
    return NextResponse.json(
      { message: "registrationId is required." },
      { status: 400 }
    );
  }

  const registration = await prisma.registration.update({
    where: { id: registrationId },
    data: { bookingAssignedTo: bookingAssignedTo?.trim() || null },
  });

  return NextResponse.json(registration);
}
