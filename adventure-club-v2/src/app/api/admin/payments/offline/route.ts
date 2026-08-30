import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { notifyWhatsappGroupInvite } from "@/lib/notification-emails";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const {
      registrationId,
      method,
      amount,
      reference,
      recordedBy,
      type,
    } = await req.json();

    const registration =
      await prisma.registration.findUnique({
        where: {
          id: registrationId,
        },
        include: {
          trek: true,
          user: true,
        },
      });

    if (!registration) {
      return NextResponse.json(
        {
          message:
            "Registration not found.",
        },
        {
          status: 404,
        }
      );
    }

    const payment =
      await prisma.payment.create({
        data: {
          registrationId,

          type:
            type === "FINAL"
              ? PaymentType.FINAL
              : type === "SECOND"
              ? PaymentType.SECOND
              : PaymentType.INITIAL,

          amount,

          status:
            PaymentStatus.PAID,

          paymentMethod:
            method === "UPI"
              ? PaymentMethod.UPI
              : method ===
                "BANK_TRANSFER"
              ? PaymentMethod.BANK_TRANSFER
              : PaymentMethod.CASH,

          verifiedBy: recordedBy,

          paidAt: new Date(),

          reference,
        },
      });

    // A single-installment trek has no real "final payment" — recording its
    // one payment (as INITIAL) must also complete the final-payment flags,
    // since every downstream journey/admin view keys off those to decide
    // when a registration is fully paid.
    const isSingleInstallment = registration.trek.installments === 1;

    await prisma.registration.update({
  where: {
    id: registrationId,
  },

  data: {
    paymentMethod: method,
    paymentReference: reference,
    paymentAmount: Number(amount),

    paymentRecordedAt: new Date(),
    paymentRecordedBy: recordedBy,

    offlinePaymentCreated: true,
    offlinePaymentVerified: true,

    ...(type === "FINAL"
      ? {
          finalPaymentPaid: true,
          finalPaymentPaidAt: new Date(),
          finalPaymentDidNotPay: false,
          finalPaymentPaidAtOnce: false,
        }
      : type === "SECOND"
      ? {
          secondPaymentPaid: true,
          secondPaymentPaidAt: new Date(),
          secondPaymentDidNotPay: false,
        }
      : {
          initialPaymentPaid: true,
          initialPaymentPaidAt: new Date(),
          initialPaymentDidNotPay: false,
          ...(isSingleInstallment
            ? {
                finalPaymentUnlocked: true,
                finalPaymentPaid: true,
                finalPaymentPaidAt: new Date(),
                finalPaymentDidNotPay: false,
              }
            : {}),
        }),
  },
});

    // Same WhatsApp group invite as the online-verify route — this route
    // marks the payment paid+verified immediately (an admin recording cash/
    // bank transfer in person), so the trigger conditions are simpler: just
    // "initial payment, trek has a link, not already sent".
    if (type !== "FINAL" && type !== "SECOND" && registration.trek.whatsappGroupLink && registration.user) {
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

    return NextResponse.json(
      payment
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        message:
          "Failed to record payment.",
      },
      {
        status: 500,
      }
    );
  }
}