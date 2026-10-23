import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Free treks/workshops skip the payment portal entirely (approval
// auto-verifies payment — see updateRegistrationStatus), so they never pick
// up paymentPortal: true the way a paid trek's registrations do once a
// payment proof is submitted or an admin adds them manually. The Payments
// tab's own /api/admin/payments/[trekId] route gates on that flag, which
// would make this list permanently empty for exactly the entries it needs
// to show — so this queries registrations directly instead.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const trek = await prisma.trek.findUnique({
      where: { id },
      select: { whatsappGroupLink: true },
    });

    if (!trek) {
      return NextResponse.json({ message: "Trek not found." }, { status: 404 });
    }

    const registrations = await prisma.registration.findMany({
      where: {
        trekId: id,
        status: { in: ["APPROVED", "COMPLETED", "MISSED"] },
      },
      select: {
        id: true,
        isGuest: true,
        guestName: true,
        guestPhoneNumber: true,
        whatsappInviteSentAt: true,
        whatsappGroupJoined: true,
        user: {
          select: { fullName: true, clubId: true, phoneNumber: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      registrations,
      whatsappGroupLink: trek.whatsappGroupLink,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load WhatsApp list." },
      { status: 500 }
    );
  }
}
