import { NextRequest, NextResponse } from "next/server";
import { ImageProcessingError, uploadBuffer } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@prisma/client";

const MAX_SCREENSHOT_BYTES = 1024 * 1024; // 1MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const registrationId = form.get(
      "registrationId"
    ) as string;

    const transactionId = form.get(
      "transactionId"
    ) as string;

    const typeField = form.get("type");

    const paymentType =
      typeField === "FINAL"
        ? PaymentType.FINAL
        : typeField === "SECOND"
        ? PaymentType.SECOND
        : PaymentType.INITIAL;

    const screenshot =
      form.get("screenshot");

    if (screenshot instanceof File && screenshot.size > MAX_SCREENSHOT_BYTES) {
      return NextResponse.json(
        {
          message:
            "Screenshot is too large (over 1MB). Please compress it and try again.",
        },
        { status: 400 }
      );
    }

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
            "Registration not found",
        },
        {
          status: 404,
        }
      );
    }

    let screenshotUrl: string | null = null;

if (screenshot instanceof File) {
  const bytes = await screenshot.arrayBuffer();

  const buffer = Buffer.from(bytes);

  const uploaded = await uploadBuffer(buffer, screenshot.type, {
    folder: "payment-proofs",
  });

  screenshotUrl = uploaded.secure_url;
}

    const amount =
      paymentType === PaymentType.FINAL
        ? registration.trek.finalPayment
        : paymentType === PaymentType.SECOND
        ? registration.trek.secondPayment
        : registration.trek.initialPayment;

    await prisma.payment.create({
      data: {
        registrationId,

        type: paymentType,

        amount,

        paymentMethod:
          PaymentMethod.UPI,

        status:
          PaymentStatus.PENDING,

        paidAt: new Date(),

        reference: transactionId,

        notes: screenshotUrl,
      },
    });

    // offlinePaymentCreated/Verified are shared across every installment
    // leg, reused for whichever one is currently "in flight" — that only
    // works while payment stays sequential. Second payment can now be paid
    // before Initial (open second payment + Initial still unpaid shows
    // both), so a Second submission here must NOT touch those shared flags
    // unless Initial is already paid — otherwise it would flip
    // offlinePaymentCreated on with nothing pending for Initial, which
    // hides the "Pay Initial Payment" action entirely in
    // getJourneyAction (it reads !offlinePaymentCreated as "hasn't
    // started paying").
    const affectsSharedInFlightFlags =
      paymentType !== PaymentType.SECOND || registration.initialPaymentPaid;

    await prisma.registration.update({
      where: {
        id: registrationId,
      },

      data: {
        paymentPortal: true,

        ...(affectsSharedInFlightFlags
          ? { offlinePaymentCreated: true, offlinePaymentVerified: false }
          : {}),

        paymentReference:
          transactionId,

        paymentAmount: amount,

        paymentRecordedAt:
          new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        message:
          err instanceof ImageProcessingError ? err.message : "Failed to submit payment",
      },
      {
        status: 500,
      }
    );
  }
}