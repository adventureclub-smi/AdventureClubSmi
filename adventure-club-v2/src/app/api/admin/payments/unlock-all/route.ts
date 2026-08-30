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

    const where = isSecond
      ? {
          trekId,
          initialPaymentPaid: true,
          status: { not: "REJECTED" as const },
          secondPaymentUnlocked: false,
        }
      : {
          trekId,
          initialPaymentPaid: true,
          status: { not: "REJECTED" as const },
          finalPaymentUnlocked: false,
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
