import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { registrationId, paidAtOnce } = await req.json();

    if (paidAtOnce) {
      // Nothing was separately collected for the final installment, so any
      // existing FINAL Payment row would be stale and (like the "Didn't
      // Pay" flow) override this on the student-facing view if left behind.
      await prisma.payment.deleteMany({
        where: { registrationId, type: "FINAL" },
      });

      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        select: { initialPaymentPaidAt: true },
      });

      await prisma.registration.update({
        where: { id: registrationId },
        data: {
          finalPaymentPaid: true,
          finalPaymentUnlocked: true,
          finalPaymentPaidAt: registration?.initialPaymentPaidAt ?? new Date(),
          finalPaymentPaidAtOnce: true,
          finalPaymentDidNotPay: false,
        },
      });
    } else {
      await prisma.registration.update({
        where: { id: registrationId },
        data: {
          finalPaymentPaid: false,
          finalPaymentPaidAt: null,
          finalPaymentPaidAtOnce: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json({ message: "Failed to update payment." }, { status: 500 });
  }
}
