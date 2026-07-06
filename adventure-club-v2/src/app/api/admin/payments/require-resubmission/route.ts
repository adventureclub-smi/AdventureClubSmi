import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { registrationId, type } = await req.json();

    if (!registrationId || (type !== "INITIAL" && type !== "FINAL")) {
      return NextResponse.json(
        { message: "registrationId and a valid type are required." },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        offlinePaymentCreated: false,
        offlinePaymentVerified: false,
        paymentReference: null,

        ...(type === "FINAL"
          ? { finalPaymentPaid: false, finalPaymentPaidAt: null }
          : { initialPaymentPaid: false, initialPaymentPaidAt: null }),
      },
    });

    return NextResponse.json({
      message: "Resubmission requested.",
      registration,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to request resubmission." },
      { status: 500 }
    );
  }
}
