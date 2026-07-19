import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { registrationId, type, notPaid } = await req.json();

    const paymentType = type === "FINAL" ? "FINAL" : "INITIAL";

    // The student-facing view reads the Payment record before falling back
    // to the registration's own flags, so a stale PAID/PENDING row (common
    // on historical imports) would silently override "Didn't Pay" there.
    if (notPaid) {
      await prisma.payment.deleteMany({
        where: { registrationId, type: paymentType },
      });
    }

    await prisma.registration.update({
      where: { id: registrationId },
      data:
        paymentType === "FINAL"
          ? {
              finalPaymentDidNotPay: !!notPaid,
              ...(notPaid ? { finalPaymentPaid: false, finalPaymentPaidAt: null } : {}),
            }
          : {
              initialPaymentDidNotPay: !!notPaid,
              ...(notPaid
                ? {
                    initialPaymentPaid: false,
                    initialPaymentPaidAt: null,
                    offlinePaymentCreated: false,
                    offlinePaymentVerified: false,
                  }
                : {}),
            },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json({ message: "Failed to update payment." }, { status: 500 });
  }
}
