import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyFinalPaymentOpen, notifySecondPaymentOpen } from "@/lib/notification-emails";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId, type } = await req.json();

    if (!trekId) {
      return NextResponse.json({ message: "trekId is required." }, { status: 400 });
    }

    // type is optional and defaults to FINAL — every existing caller
    // predates the second-payment leg and never sends it.
    const isSecond = type === "SECOND";

    // Second payment can now be shown (and paid) even before Initial is
    // paid — see NextTrekCard's showSecondPaymentAlongsideInitial — so
    // "unlock for everyone" must not skip anyone still owing Initial, or
    // this bulk action silently does nothing for exactly the people that
    // feature is for. status: "APPROVED" takes over as the eligibility
    // gate instead (matching getJourneyAction, which never offers any
    // payment action before a registration is approved).
    // Someone removed from the Payments section (hiddenFromPayments) is
    // meant to be out of payment tracking entirely, so a bulk unlock
    // shouldn't reach back in and unlock anything for them. { not: true }
    // rather than a bare `false` — hiddenFromPayments is a brand-new field,
    // so every registration that predates it is simply missing the key in
    // MongoDB, and an equality match against `false` would NOT match a
    // missing field (unlike { not: true }, which correctly treats missing
    // the same as its false default).
    const where = isSecond
      ? {
          trekId,
          status: "APPROVED" as const,
          secondPaymentUnlocked: false,
          hiddenFromPayments: { not: true },
        }
      : {
          trekId,
          initialPaymentPaid: true,
          status: { not: "REJECTED" as const },
          finalPaymentUnlocked: false,
          hiddenFromPayments: { not: true },
        };

    // Fetched before the updateMany (which only returns a count) so every
    // newly-unlocked participant can be emailed — the where clause itself
    // guarantees each of these is a genuine locked -> unlocked transition.
    const toNotify = await prisma.registration.findMany({
      where,
      include: { user: true, trek: true },
    });

    const result = await prisma.registration.updateMany({
      where,
      data: isSecond ? { secondPaymentUnlocked: true } : { finalPaymentUnlocked: true },
    });

    for (const registration of toNotify) {
      try {
        if (isSecond) {
          await notifySecondPaymentOpen(registration);
        } else {
          await notifyFinalPaymentOpen(registration);
        }
      } catch (emailError) {
        console.error(`Failed to send ${isSecond ? "second" : "final"}-payment-open email:`, emailError);
      }
    }

    return NextResponse.json({
      message: `${isSecond ? "Second" : "Final"} payment unlocked for ${result.count} participant(s).`,
      count: result.count,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to unlock payment for all." },
      { status: 500 }
    );
  }
}
