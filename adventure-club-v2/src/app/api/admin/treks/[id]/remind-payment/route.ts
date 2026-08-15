import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyInitialPaymentReminders } from "@/lib/notification-emails";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: trekId } = await params;

    const trek = await prisma.trek.findUnique({ where: { id: trekId } });

    if (!trek) {
      return NextResponse.json({ message: "Trek not found." }, { status: 404 });
    }

    // Same "still owes initial payment" definition as getJourneyAction's own
    // "Pay Initial Payment" CTA — approved, nothing paid yet, and no offline
    // proof already sitting in the verification queue (they've already acted;
    // a reminder to "pay" would be confusing).
    const pending = await prisma.registration.findMany({
      where: {
        trekId,
        status: "APPROVED",
        initialPaymentPaid: false,
        offlinePaymentCreated: false,
      },
      include: { user: true },
    });

    const sentCount = await notifyInitialPaymentReminders(trek, pending);

    return NextResponse.json({
      message:
        sentCount === 0
          ? "No one is currently approved and still owing their initial payment."
          : `Reminder sent to ${sentCount} student${sentCount === 1 ? "" : "s"}.`,
      count: sentCount,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to send payment reminders." },
      { status: 500 }
    );
  }
}
