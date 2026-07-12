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
      select: { status: true },
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

    const registration = await prisma.registration.update({
      where: {
        id,
      },

      data: {
        status: statusMap[status],
        remarks,

        approvedAt:
          statusMap[status] === RegistrationStatus.APPROVED
            ? new Date()
            : null,

        initialPaymentDeadline:
          statusMap[status] === RegistrationStatus.APPROVED &&
          paymentDays
            ? new Date(
                Date.now() +
                  Number(paymentDays) *
                    24 *
                    60 *
                    60 *
                    1000
              )
            : null,
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