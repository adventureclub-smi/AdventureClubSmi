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

  const existing = await prisma.registration.findUnique({
    where: { id: body.registrationId },
    select: { finalPaymentUnlocked: true },
  });

  const registration = await prisma.registration.update({
    where: {
      id: body.registrationId,
    },
    data: {
      finalPaymentUnlocked: body.unlock,
    },
    include: {
      user: true,
      trek: true,
    },
  });

  if (body.unlock && existing && !existing.finalPaymentUnlocked) {
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