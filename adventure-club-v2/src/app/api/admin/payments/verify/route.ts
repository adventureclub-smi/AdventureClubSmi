import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { registrationId, verified, type } = await req.json();

    const paymentType = type === "FINAL" ? "FINAL" : "INITIAL";

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
      select: { trek: { select: { installments: true } } },
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
            }
          : {
              initialPaymentPaid: verified,
              offlinePaymentVerified: verified,
              initialPaymentPaidAt: verified ? new Date() : null,
              ...(isSingleInstallment
                ? {
                    finalPaymentUnlocked: verified,
                    finalPaymentPaid: verified,
                    finalPaymentPaidAt: verified ? new Date() : null,
                  }
                : {}),
            },
    });

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