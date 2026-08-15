import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyWhatsappGroupInvite } from "@/lib/notification-emails";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Manual escape hatch for the automatic invite (see payments/verify and
// payments/offline) — that one only ever fires once, right at the moment
// initial payment gets verified, so anyone whose trek didn't have a
// WhatsApp link set yet at that exact moment falls through the gap. This
// lets an admin (re)send it on demand any time afterward instead.
export async function POST(req: Request, { params }: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { trek: true, user: true },
    });

    if (!registration) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }

    if (!registration.user) {
      return NextResponse.json(
        { message: "This registration has no linked student account to email." },
        { status: 400 }
      );
    }

    if (!registration.initialPaymentPaid && !registration.offlinePaymentVerified) {
      return NextResponse.json(
        { message: "This student's initial payment isn't verified yet." },
        { status: 400 }
      );
    }

    if (!registration.trek.whatsappGroupLink) {
      return NextResponse.json(
        { message: "This trek has no WhatsApp group link set — add one in Trip Centre first." },
        { status: 400 }
      );
    }

    await notifyWhatsappGroupInvite(registration.user, registration.trek);

    await prisma.registration.update({
      where: { id },
      data: { whatsappInviteSentAt: new Date() },
    });

    return NextResponse.json({ message: `WhatsApp invite sent to ${registration.user.fullName}.` });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to send WhatsApp invite." },
      { status: 500 }
    );
  }
}
