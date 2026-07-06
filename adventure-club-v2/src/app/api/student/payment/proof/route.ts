import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@prisma/client";

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

    // TODO:
    // Upload screenshot to Cloudinary later.
    let screenshotUrl: string | null = null;

if (screenshot instanceof File) {
  const bytes = await screenshot.arrayBuffer();

  const buffer = Buffer.from(bytes);

  screenshotUrl = await new Promise<string>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "payment-proofs",
          },
          (error, result) => {
            if (error || !result)
              reject(error);

            else
              resolve(result.secure_url);
          }
        )
        .end(buffer);
    }
  );
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