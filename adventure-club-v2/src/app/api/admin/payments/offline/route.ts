import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";

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