import { Check, IndianRupee, Clock, FileText, CreditCard, Mountain } from "lucide-react";
import styles from "./PaymentTimeline.module.scss";

type TimelineRegistration = {
  initialPaymentPaid: boolean;
  offlinePaymentCreated: boolean;
  finalPaymentPaid: boolean;
  finalPaymentUnlocked: boolean;
  attendanceMarked: boolean;
};

export default function PaymentTimeline({
  registration,
}: {
  registration: TimelineRegistration;
}) {
  const steps = [
    {
      key: "approved",
      title: "Registration Approved",
      subtitle: "Your registration has been approved.",
      state: "done" as const,
      icon: Check,
    },
    {
      key: "initial",
      title: "Initial Payment",
      subtitle: registration.initialPaymentPaid
        ? "Payment Verified"
        : registration.offlinePaymentCreated
        ? "Club will verify it shortly."
        : "Waiting for payment",
      state: registration.initialPaymentPaid
        ? ("done" as const)
        : registration.offlinePaymentCreated
        ? ("waiting" as const)
        : ("pending" as const),
      icon: registration.initialPaymentPaid ? Check : IndianRupee,
    },
    {
      key: "bond",
      title: "Bond Form",
      subtitle: registration.initialPaymentPaid
        ? "Available"
        : "Locked until payment verification.",
      state: registration.initialPaymentPaid ? ("done" as const) : ("locked" as const),
      icon: FileText,
    },
    {
      key: "final",
      title: "Final Payment",
      subtitle: registration.finalPaymentPaid
        ? "Verified"
        : registration.finalPaymentUnlocked
        ? "Ready to pay"
        : "Locked",
      state: registration.finalPaymentPaid
        ? ("done" as const)
        : registration.finalPaymentUnlocked
        ? ("waiting" as const)
        : ("locked" as const),
      icon: CreditCard,
    },
    {
      key: "trek",
      title: "Trek Day",
      subtitle: registration.attendanceMarked ? "Checked In" : "Upcoming",
      state: registration.attendanceMarked ? ("done" as const) : ("locked" as const),
      icon: Mountain,
    },
  ];

  return (
    <div className={styles.timeline}>
      {steps.map((step, i) => (
        <div key={step.key}>
          <div className={styles.step}>
            <div className={styles[step.state]}>
              {step.state === "waiting" ? <Clock size={18} /> : <step.icon size={18} />}
            </div>

            <div>
              <h3>{step.title}</h3>
              <p>{step.subtitle}</p>
            </div>
          </div>

          {i < steps.length - 1 && <div className={styles.line} />}
        </div>
      ))}
    </div>
  );
}
