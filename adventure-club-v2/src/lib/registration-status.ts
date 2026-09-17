import { prisma } from "@/lib/prisma";
import { RegistrationStatus } from "@prisma/client";
import { notifyRegistrationStatus } from "@/lib/notification-emails";

export const REGISTRATION_STATUS_MAP: Record<string, RegistrationStatus> = {
  Waiting: RegistrationStatus.WAITING,
  Approved: RegistrationStatus.APPROVED,
  Waitlist: RegistrationStatus.WAITLIST,
  Rejected: RegistrationStatus.REJECTED,
  "Timed Out": RegistrationStatus.TIMED_OUT,
  Completed: RegistrationStatus.COMPLETED,
  Missed: RegistrationStatus.MISSED,

  WAITING: RegistrationStatus.WAITING,
  APPROVED: RegistrationStatus.APPROVED,
  WAITLIST: RegistrationStatus.WAITLIST,
  REJECTED: RegistrationStatus.REJECTED,
  TIMED_OUT: RegistrationStatus.TIMED_OUT,
  COMPLETED: RegistrationStatus.COMPLETED,
  MISSED: RegistrationStatus.MISSED,
};

// Shared by the single-registration PUT route and the bulk-approve route so
// the two can never disagree on what "approving" actually does (deadline,
// free-trek auto-unlock, status-change email).
export async function updateRegistrationStatus(
  id: string,
  {
    status,
    remarks,
    paymentDays,
  }: { status: string; remarks?: string; paymentDays?: number }
) {
  const existing = await prisma.registration.findUnique({
    where: { id },
    select: { status: true, trek: { select: { price: true } } },
  });

  const approvingNow = REGISTRATION_STATUS_MAP[status] === RegistrationStatus.APPROVED;

  // Free treks/workshops (price 0) skip payment entirely — there's
  // nothing to pay or verify, so approval alone should unlock everything
  // a paid registration would only reach after its payment is verified.
  const isFree = existing?.trek?.price === 0;

  const registration = await prisma.registration.update({
    where: { id },

    data: {
      status: REGISTRATION_STATUS_MAP[status],
      remarks,

      approvedAt: approvingNow ? new Date() : null,

      initialPaymentDeadline:
        approvingNow && paymentDays
          ? new Date(Date.now() + Number(paymentDays) * 24 * 60 * 60 * 1000)
          : null,

      ...(approvingNow && isFree
        ? {
            initialPaymentPaid: true,
            initialPaymentPaidAt: new Date(),
            secondPaymentUnlocked: true,
            secondPaymentPaid: true,
            secondPaymentPaidAt: new Date(),
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

  return registration;
}
