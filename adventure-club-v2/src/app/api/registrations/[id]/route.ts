import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { notifyRegistrationStatus } from "@/lib/notification-emails";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const body = await req.json();

    const {
      status,
      remarks,
      paymentDays,
    } = body;

    const existing = await prisma.registration.findUnique({
      where: { id },
      select: { status: true, trek: { select: { price: true } } },
    });

    const statusMap: Record<string, RegistrationStatus> = {
      Waiting: RegistrationStatus.WAITING,
      Approved: RegistrationStatus.APPROVED,
      Waitlist: RegistrationStatus.WAITLIST,
      Rejected: RegistrationStatus.REJECTED,
      Completed: RegistrationStatus.COMPLETED,
      Missed: RegistrationStatus.MISSED,

      WAITING: RegistrationStatus.WAITING,
      APPROVED: RegistrationStatus.APPROVED,
      WAITLIST: RegistrationStatus.WAITLIST,
      REJECTED: RegistrationStatus.REJECTED,
      COMPLETED: RegistrationStatus.COMPLETED,
      MISSED: RegistrationStatus.MISSED,
    };

    const approvingNow = statusMap[status] === RegistrationStatus.APPROVED;

    // Free treks/workshops (price 0) skip payment entirely — there's
    // nothing to pay or verify, so approval alone should unlock everything
    // a paid registration would only reach after its payment is verified.
    const isFree = existing?.trek?.price === 0;

    const registration = await prisma.registration.update({
      where: {
        id,
      },

      data: {
        status: statusMap[status],
        remarks,

        approvedAt: approvingNow ? new Date() : null,

        initialPaymentDeadline:
          approvingNow && paymentDays
            ? new Date(
                Date.now() +
                  Number(paymentDays) *
                    24 *
                    60 *
                    60 *
                    1000
              )
            : null,

        ...(approvingNow && isFree
          ? {
              initialPaymentPaid: true,
              initialPaymentPaidAt: new Date(),
              finalPaymentUnlocked: true,
              finalPaymentPaid: true,
              finalPaymentPaidAt: new Date(),
            }
          : {}),
      },

      include: {
        user: true,
        trek: true,
      },
    });

    if (existing && existing.status !== registration.status) {
      try {
        await notifyRegistrationStatus(registration);
      } catch (emailError) {
        console.error("Failed to send registration status email:", emailError);
      }
    }

    return NextResponse.json({
      message: "Registration updated successfully.",
      registration,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to update registration.",
      },
      {
        status: 500,
      }
    );
  }
}