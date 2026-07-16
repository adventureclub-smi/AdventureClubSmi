import type { StatusTone } from "@/components/dashboard/shared/StatusBadge";

export type RegistrationState = "NOT_OPEN" | "OPEN" | "CLOSED";

export type RegistrationLike = {
  id: string;
  status: string;
  initialPaymentDeadline?: string | null;
  initialPaymentPaid: boolean;
  offlinePaymentCreated: boolean;
  offlinePaymentVerified: boolean;
  bondFormSubmitted: boolean;
  attendanceMarked: boolean;
  finalPaymentUnlocked: boolean;
  finalPaymentPaid: boolean;
  certificateIssued: boolean;
  trek?: { tripCentrePublished?: boolean; installments?: number };
};

export type JourneyStep = {
  key:
    | "registration"
    | "approval"
    | "initialPayment"
    | "bondForm"
    | "tripCentre"
    | "finalPayment"
    | "attendance"
    | "certificate"
    | "completed";
  title: string;
  subtitle: string;
  done: boolean;
  current: boolean;
};

export type JourneyBadge = {
  text: string;
  tone: "waiting" | "approved" | "open" | "rejected" | "waitlist" | "completed";
};

export type JourneyAction = {
  text: string;
  href: string | null;
  variant:
    | "register"
    | "pay"
    | "tripCentre"
    | "finalPay"
    | "certificate"
    | "disabled";
};

export function getJourneySteps(
  registration: RegistrationLike | null,
  registrationState?: RegistrationState
): JourneyStep[] {
  const isSingleInstallment = registration?.trek?.installments === 1;

  const steps: Omit<JourneyStep, "current">[] = [
    {
      key: "registration",
      title: "Registration",
      done: !!registration,
      subtitle: registration
        ? "Successfully Registered"
        : registrationState === "NOT_OPEN"
        ? "Opens Soon"
        : registrationState === "CLOSED"
        ? "Closed"
        : "Open",
    },
    {
      key: "approval",
      title: "Approval",
      done:
        registration?.status === "APPROVED" ||
        registration?.status === "COMPLETED" ||
        registration?.status === "MISSED",
      subtitle:
        registration?.status === "WAITING"
          ? "Waiting for Admin"
          : registration?.status === "APPROVED"
          ? "Approved"
          : "Pending",
    },
    {
      key: "initialPayment",
      title: isSingleInstallment ? "Full Payment" : "Initial Payment",
      done: !!(
        registration?.initialPaymentPaid ||
        registration?.offlinePaymentVerified
      ),
      subtitle:
        registration?.initialPaymentPaid ||
        registration?.offlinePaymentVerified
          ? "Verified"
          : registration?.offlinePaymentCreated
          ? "Verification Pending"
          : "Pending",
    },
    {
      key: "bondForm",
      title: "Bond Form",
      done: !!registration?.bondFormSubmitted,
      subtitle: registration?.bondFormSubmitted ? "Submitted" : "Pending",
    },
    {
      key: "tripCentre",
      title: "Trip Centre",
      done: !!registration?.trek?.tripCentrePublished,
      subtitle: registration?.trek?.tripCentrePublished
        ? "Available"
        : "Waiting for Admin",
    },
    // A single-installment trek has no separate final payment — the one
    // payment above already covers it, so this step would just be a
    // redundant "done" duplicate of "Full Payment".
    ...(isSingleInstallment
      ? []
      : [
          {
            key: "finalPayment" as const,
            title: "Final Payment",
            done: !!registration?.finalPaymentPaid,
            subtitle: registration?.finalPaymentUnlocked
              ? registration?.finalPaymentPaid
                ? "Verified"
                : "Ready to Pay"
              : "Locked",
          },
        ]),
    {
      key: "attendance",
      title: "Attendance",
      done: !!registration?.attendanceMarked,
      subtitle: registration?.attendanceMarked ? "Present" : "Pending Trek",
    },
    {
      key: "certificate",
      title: "Certificate",
      done: !!registration?.certificateIssued,
      subtitle: registration?.certificateIssued ? "Issued" : "Optional",
    },
    {
      key: "completed",
      title: "Trip Completed",
      done: registration?.status === "COMPLETED" || registration?.status === "MISSED",
      subtitle:
        registration?.status === "COMPLETED"
          ? "Adventure Completed"
          : registration?.status === "MISSED"
          ? "Trip Missed"
          : "Upcoming",
    },
  ];

  const firstPending = steps.findIndex((step) => !step.done);
  const currentIndex = firstPending === -1 ? steps.length - 1 : firstPending;

  return steps.map((step, i) => ({ ...step, current: i === currentIndex }));
}

export function getJourneyBadge(
  registration: RegistrationLike | null,
  registrationState?: RegistrationState
): JourneyBadge {
  if (!registration) {
    switch (registrationState) {
      case "NOT_OPEN":
        return { text: "Registration Opens Soon", tone: "waiting" };
      case "CLOSED":
        return { text: "Registrations Closed", tone: "rejected" };
      default:
        return { text: "Registration Open", tone: "open" };
    }
  }

  switch (registration.status) {
    case "WAITING":
      return { text: "Waiting Approval", tone: "waiting" };
    case "APPROVED":
      return { text: "Approved", tone: "approved" };
    case "WAITLIST":
      return { text: "Waitlisted", tone: "waitlist" };
    case "REJECTED":
      return { text: "Rejected", tone: "rejected" };
    case "COMPLETED":
      return { text: "Completed", tone: "completed" };
    case "MISSED":
      return { text: "Trip Missed", tone: "rejected" };
    default:
      return { text: "", tone: "waiting" };
  }
}

export function getJourneyAction(
  trekId: string,
  registration: RegistrationLike | null,
  registrationState?: RegistrationState
): JourneyAction {
  if (!registration) {
    if (registrationState === "NOT_OPEN") {
      return {
        text: "Registration Opens Soon",
        href: null,
        variant: "disabled",
      };
    }

    if (registrationState === "CLOSED") {
      return {
        text: "Registrations Closed",
        href: null,
        variant: "disabled",
      };
    }

    return { text: "Register Now", href: `/treks/${trekId}`, variant: "register" };
  }

  if (registration.status === "WAITING") {
    return { text: "Waiting for Approval", href: null, variant: "disabled" };
  }

  const isSingleInstallment = registration.trek?.installments === 1;

  if (
    registration.status === "APPROVED" &&
    registration.offlinePaymentCreated &&
    !registration.offlinePaymentVerified
  ) {
    return {
      text: isSingleInstallment
        ? "Waiting for Payment Verification"
        : "Waiting for Initial Payment Verification",
      href: null,
      variant: "disabled",
    };
  }

  if (
    registration.status === "APPROVED" &&
    !registration.initialPaymentPaid &&
    !registration.offlinePaymentCreated
  ) {
    return {
      text: isSingleInstallment ? "Pay Full Payment" : "Pay Initial Payment",
      href: `/student/payments/${registration.id}`,
      variant: "pay",
    };
  }

  // A single-installment trek's one payment auto-completes the final-payment
  // flags too (see the payments/verify and payments/offline routes), so
  // there's no separate final-payment leg to gate this on — trip centre
  // stays the focus straight through to attendance being marked.
  if (
    registration.initialPaymentPaid &&
    (isSingleInstallment ? !registration.attendanceMarked : !registration.finalPaymentUnlocked)
  ) {
    if (registration.trek?.tripCentrePublished) {
      return {
        text: "Open Trip Centre",
        href: `/student/trip-centre/${registration.id}`,
        variant: "tripCentre",
      };
    }

    return {
      text: "Waiting for Trip Centre",
      href: null,
      variant: "disabled",
    };
  }

  if (registration.finalPaymentUnlocked && !registration.finalPaymentPaid) {
    return {
      text: "Pay Final Payment",
      href: `/student/payments/${registration.id}?type=FINAL`,
      variant: "finalPay",
    };
  }

  if (registration.status === "MISSED") {
    return { text: "Trip Missed", href: null, variant: "disabled" };
  }

  if (registration.status === "COMPLETED" && registration.certificateIssued) {
    return {
      text: "Download Certificate",
      href: "/dashboard/certificates",
      variant: "certificate",
    };
  }

  if (registration.status === "COMPLETED") {
    return { text: "Trip Completed", href: null, variant: "disabled" };
  }

  if (registration.finalPaymentPaid && !registration.attendanceMarked) {
    return { text: "Waiting for Trek Day", href: null, variant: "disabled" };
  }

  if (registration.finalPaymentPaid && registration.attendanceMarked) {
    return { text: "Awaiting Trek Completion", href: null, variant: "disabled" };
  }

  if (registration.certificateIssued) {
    return {
      text: "Download Certificate",
      href: "/dashboard/certificates",
      variant: "certificate",
    };
  }

  return { text: "View Trek", href: `/dashboard/trip-centre/${trekId}`, variant: "tripCentre" };
}

export type PaymentInfo = {
  type: "INITIAL" | "FINAL";
  amount: number;
  status: "LOCKED" | "PENDING" | "PAID";
  paidAt?: string | null;
  displayOverride?: string | null;
};

export type PaymentRow = {
  label: string;
  amount: number;
  text: string;
  tone: StatusTone;
  paidAt?: string | null;
  displayOverride?: string | null;
};

export type PaymentRegistrationLike = RegistrationLike & {
  payments: PaymentInfo[];
  trek?: {
    initialPayment: number;
    finalPayment: number;
    tripCentrePublished?: boolean;
    installments?: number;
  };
};

export function getPaymentBadge(
  reg: PaymentRegistrationLike
): { text: string; tone: StatusTone } {
  if (reg.finalPaymentPaid) return { text: "Fully Paid", tone: "success" };
  if (reg.finalPaymentUnlocked) return { text: "Final Payment Due", tone: "waiting" };
  if (reg.initialPaymentPaid) return { text: "Initial Paid", tone: "success" };
  if (reg.offlinePaymentCreated) return { text: "Verification Pending", tone: "waiting" };
  return { text: "Payment Pending", tone: "neutral" };
}

export function getPaymentRows(reg: PaymentRegistrationLike): PaymentRow[] {
  const isSingleInstallment = reg.trek?.installments === 1;
  const initialLabel = isSingleInstallment ? "Full Payment" : "Initial Payment";

  const initial = reg.payments.find((p) => p.type === "INITIAL");
  const final = reg.payments.find((p) => p.type === "FINAL");

  const rows: PaymentRow[] = [
    initial?.status === "PAID"
      ? {
          label: initialLabel,
          amount: initial.amount,
          text: "Paid & Verified",
          tone: "success",
          paidAt: initial.paidAt,
          displayOverride: initial.displayOverride,
        }
      : initial?.status === "PENDING"
      ? {
          label: initialLabel,
          amount: initial.amount,
          text: "Verification Pending",
          tone: "waiting",
        }
      : {
          label: initialLabel,
          amount: reg.trek?.initialPayment ?? 0,
          text: "Not Paid Yet",
          tone: "neutral",
        },
  ];

  if (!isSingleInstallment && (reg.finalPaymentUnlocked || final)) {
    rows.push(
      final?.status === "PAID"
        ? {
            label: "Final Payment",
            amount: final.amount,
            text: "Paid & Verified",
            tone: "success",
            paidAt: final.paidAt,
            displayOverride: final.displayOverride,
          }
        : final?.status === "PENDING"
        ? {
            label: "Final Payment",
            amount: final.amount,
            text: "Verification Pending",
            tone: "waiting",
          }
        : {
            label: "Final Payment",
            amount: reg.trek?.finalPayment ?? 0,
            text: "Not Paid Yet",
            tone: "neutral",
          }
    );
  }

  return rows;
}
