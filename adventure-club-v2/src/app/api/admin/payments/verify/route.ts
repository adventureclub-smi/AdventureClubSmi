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

    if (!payment) {
      return NextResponse.json(
        {
          message: "Payment not found",
        },
        {
          status: 404,
        }
      );
    }

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