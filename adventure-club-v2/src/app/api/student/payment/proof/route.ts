import { NextRequest, NextResponse } from "next/server";
import { uploadBuffer } from "@/lib/storage";
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

    await prisma.registration.update({
      where: {
        id: registrationId,
      },

      data: {
        paymentPortal: true,

        offlinePaymentCreated: true,

        offlinePaymentVerified: false,

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
          "Failed to submit payment",
      },
      {
        status: 500,
      }
    );
  }
}