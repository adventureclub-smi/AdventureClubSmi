import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyFinalPaymentOpen } from "@/lib/notification-emails";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  // type is optional and defaults to FINAL — every existing caller predates
  // the second-payment leg and never sends it.
  const isSecond = body.type === "SECOND";

  const existing = await prisma.registration.findUnique({
    where: { id: body.registrationId },
    select: { finalPaymentUnlocked: true, secondPaymentUnlocked: true },
  });

  const registration = await prisma.registration.update({
    where: {
      id: body.registrationId,
    },
    data: isSecond
      ? { secondPaymentUnlocked: body.unlock }
      : { finalPaymentUnlocked: body.unlock },
    include: {
      user: true,
      trek: true,
    },
  });

  // No "second payment open" email exists yet (unlike Final Payment) — this
  // just flips the flag silently for now.
  if (!isSecond && body.unlock && existing && !existing.finalPaymentUnlocked) {
    try {
      await notifyFinalPaymentOpen(registration);
    } catch (emailError) {
      console.error("Failed to send final-payment-open email:", emailError);
    }
  }

  return NextResponse.json({
    success: true,
  });
}