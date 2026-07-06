"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import styles from "./PaymentCountdown.module.scss";

type Props = {
  deadline: string | Date;
  heading?: string;
  subheading?: string;
  expiredHeading?: string;
  expiredMessage?: string;
};

export default function PaymentCountdown({
  deadline,
  heading = "Complete your Initial Payment",
  subheading = "Payment closes in",
  expiredHeading = "Payment Deadline Expired",
  expiredMessage = "Please contact the Adventure Club for further assistance.",
}: Props) {
  const time = useCountdown(deadline);

  if (time.passed) {
    return (
      <div className={styles.expired}>
        <h3>
          <Clock size={18} /> {expiredHeading}
        </h3>
        <p>{expiredMessage}</p>
      </div>
    );
  }

  const urgent = time.days === 0;

  return (
    <div className={`${styles.card} ${urgent ? styles.urgent : ""}`}>
      <h3>{heading}</h3>
      <p>{subheading}</p>

      <div className={styles.timer}>
        <div>
          <span>{time.days}</span>
          <small>Days</small>
        </div>
        <div>
          <span>{time.hours}</span>
          <small>Hours</small>
        </div>
        <div>
          <span>{time.minutes}</span>
          <small>Minutes</small>
        </div>
        <div>
          <span>{time.seconds}</span>
          <small>Seconds</small>
        </div>
      </div>

      {urgent && (
        <div className={styles.warning}>
          <AlertTriangle size={16} /> Less than 24 hours remaining
        </div>
      )}
    </div>
  );
}
