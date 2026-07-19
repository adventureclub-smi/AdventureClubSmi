import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { registrationId, type, amount } = await req.json();

    const paymentType = type === "FINAL" ? "FINAL" : "INITIAL";
    const parsedAmount = Number(amount);

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }

    const existing = await prisma.payment.findFirst({
      where: { registrationId, type: paymentType },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.payment.update({
        where: { id: existing.id },
        data: { amount: parsedAmount },
      });
    } else {
      // No Payment row yet (e.g. a historical import with nothing recorded
      // separately) — create one so the correction actually has somewhere
      // to live, matching whatever paid/not-paid state already exists.
      const isPaid =
        paymentType === "FINAL" ? registration.finalPaymentPaid : registration.initialPaymentPaid;

      await prisma.payment.create({
        data: {
          registrationId,
          type: paymentType,
          amount: parsedAmount,
          status: isPaid ? "PAID" : "PENDING",
          paidAt: isPaid ? new Date() : null,
        },
      });
    }

    // Keeps the legacy single-amount field (still read by the card grid and
    // as the Initial Payment fallback) in sync with the latest correction.
    await prisma.registration.update({
      where: { id: registrationId },
      data: { paymentAmount: parsedAmount },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json({ message: "Failed to update amount." }, { status: 500 });
  }
}
