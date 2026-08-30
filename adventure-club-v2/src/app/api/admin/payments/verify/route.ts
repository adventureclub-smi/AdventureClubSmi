import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { notifyWhatsappGroupInvite } from "@/lib/notification-emails";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { registrationId, verified, type } = await req.json();

    const paymentType = type === "FINAL" ? "FINAL" : type === "SECOND" ? "SECOND" : "INITIAL";

    const payment = await prisma.payment.findFirst({
      where: {
        registrationId,
        type: paymentType,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Historical registrations are bulk-imported with their paid/unpaid
    // flags set directly on the Registration itself — there's no Payment
    // row to flip, so just fall through to updating the registration below.
    if (payment) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: verified
            ? PaymentStatus.PAID
            : PaymentStatus.PENDING,
        },
      });
    }

    // A single-installment trek has no real "final payment" — verifying its
    // one payment (recorded as INITIAL) must also complete the final-payment
    // flags, since every downstream journey/admin view keys off those to
    // decide when a registration is fully paid.
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { trek: true, user: true },
    });

    const isSingleInstallment = registration?.trek.installments === 1;

    await prisma.registration.update({
      where: {
        id: registrationId,
      },
      data:
        paymentType === "FINAL"
          ? {
              finalPaymentPaid: verified,
              offlinePaymentVerified: verified,
              finalPaymentPaidAt: verified ? new Date() : null,
              // Verifying (or undoing) a real Final Payment transaction here
              // always supersedes the "paid at once during initial" state.
              finalPaymentPaidAtOnce: false,
              ...(verified ? { finalPaymentDidNotPay: false } : {}),
            }
          : paymentType === "SECOND"
          ? {
              secondPaymentPaid: verified,
              offlinePaymentVerified: verified,
              secondPaymentPaidAt: verified ? new Date() : null,
              ...(verified ? { secondPaymentDidNotPay: false } : {}),
            }
          : {
              initialPaymentPaid: verified,
              offlinePaymentVerified: verified,
              initialPaymentPaidAt: verified ? new Date() : null,
              ...(verified ? { initialPaymentDidNotPay: false } : {}),
              ...(isSingleInstallment
                ? {
                    finalPaymentUnlocked: verified,
                    finalPaymentPaid: verified,
                    finalPaymentPaidAt: verified ? new Date() : null,
                    ...(verified ? { finalPaymentDidNotPay: false } : {}),
                  }
                : {}),
            },
    });

    // WhatsApp group invite — only for the initial payment, only when this
    // verification actually just turned it on, only once per registration,
    // and only if the trek even has a group link set. The atomic claim
    // (updateMany matching whatsappInviteSentAt: null) guards against a
    // double-send if this ever races.
    if (paymentType === "INITIAL" && verified && registration?.trek.whatsappGroupLink && registration.user) {
      const claimed = await prisma.registration.updateMany({
        where: { id: registrationId, whatsappInviteSentAt: null },
        data: { whatsappInviteSentAt: new Date() },
      });

      if (claimed.count > 0) {
        try {
          await notifyWhatsappGroupInvite(registration.user, registration.trek);
        } catch (emailError) {
          console.error("Failed to send WhatsApp group invite email:", emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        message: "Verification failed",
      },
      {
        status: 500,
      }
    );
  }
}