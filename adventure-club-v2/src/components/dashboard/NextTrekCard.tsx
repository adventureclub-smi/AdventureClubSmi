"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, CalendarDays } from "lucide-react";

import JourneyTimeline from "./shared/JourneyTimeline";
import StatusBadge from "./shared/StatusBadge";
import { useCountdown } from "@/hooks/useCountdown";
import { useRegistrationPhase } from "@/hooks/useRegistrationPhase";
import {
  getJourneySteps,
  getJourneyBadge,
  getJourneyAction,
  type RegistrationLike,
  type RegistrationState,
} from "@/lib/registration-journey";
import styles from "./NextTrekCard.module.scss";

type Trek = {
  id: string;
  title: string;
  destination: string;
  date: string;
  coverImage?: string;
  difficulty: string;
  price: number;
  initialPayment: number;
};

type Props = {
  trek: Trek;
  registration: RegistrationLike | null;
  registrationState?: RegistrationState;
  registrationOpensAt?: string | null;
};

export default function NextTrekCard({
  trek,
  registration,
  registrationState,
  registrationOpensAt,
}: Props) {
  // Same phase hook the homepage countdown uses — it ticks its own 1s
  // interval, so "Registrations Open In" flips live to "Next Adventure In"
  // (and the button unlocks) the instant registration opens, with no page
  // refresh needed.
  const { phase, target: phaseTarget, label: phaseLabel } = useRegistrationPhase(
    trek.date,
    registrationOpensAt
  );

  // Only show the initial-payment-deadline countdown while that payment is
  // still actually pending — once it's paid (or offline-verified), the
  // deadline is moot and the countdown should fall back to the trek-day
  // countdown instead of continuing to tick down a deadline that no longer
  // matters.
  const paymentPending =
    !!registration &&
    !registration.initialPaymentPaid &&
    !registration.offlinePaymentVerified;

  const countdownTarget =
    paymentPending && registration?.initialPaymentDeadline
      ? registration.initialPaymentDeadline
      : phaseTarget;

  const countdown = useCountdown(countdownTarget);

  const isPaymentDeadlineCountdown =
    paymentPending && !!registration?.initialPaymentDeadline;

  const countdownLabel = isPaymentDeadlineCountdown
    ? "Payment Deadline"
    : phaseLabel;

  // Payment deadline and "next adventure" countdowns otherwise look
  // identical, so a payment deadline that's actually closing in needs to
  // visibly stand out — only the deadline countdown escalates color as it
  // gets close, the generic trek-day countdown never does.
  const hoursLeft = countdown.days * 24 + countdown.hours;
  const countdownUrgency: "normal" | "warning" | "danger" =
    isPaymentDeadlineCountdown && !countdown.passed
      ? hoursLeft <= 24
        ? "danger"
        : hoursLeft <= 48
        ? "warning"
        : "normal"
      : "normal";

  // The server only knows registrationState as of the initial page load, so
  // for a NOT_OPEN trek with no registration yet, defer to the live phase
  // instead — otherwise the Register button would stay locked forever until
  // a manual refresh, even after the countdown actually reaches zero.
  const effectiveRegistrationState: RegistrationState | undefined =
    !registration && registrationState === "NOT_OPEN"
      ? phase === "opensIn"
        ? "NOT_OPEN"
        : "OPEN"
      : registrationState;

  const badge = getJourneyBadge(registration, effectiveRegistrationState);
  const steps = getJourneySteps(registration, effectiveRegistrationState);
  const action = getJourneyAction(trek.id, registration, effectiveRegistrationState);

  return (
    <motion.section
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className={styles.imageSection}>
        <Image
          src={trek.coverImage || "/images/default-trek.jpg"}
          alt={trek.title}
          fill
          sizes="(max-width: 1200px) 100vw, 280px"
          className={styles.image}
        />
      </div>

      <div className={styles.detailsSection}>
        <div className={styles.header}>
          <div>
            <small>FEATURED TREK</small>
            <h2>{trek.title}</h2>

            <p>
              <MapPin size={14} /> {trek.destination}
            </p>

            <p>
              <CalendarDays size={14} />{" "}
              {new Date(trek.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {badge.text && <StatusBadge text={badge.text} tone={badge.tone} />}
        </div>

        <div className={styles.infoGrid}>
          <div>
            <span>Difficulty</span>
            <strong>{trek.difficulty}</strong>
          </div>

          <div>
            <span>Total Cost</span>
            <strong>₹{trek.price}</strong>
          </div>

          <div>
            <span>Initial</span>
            <strong>₹{trek.initialPayment}</strong>
          </div>
        </div>

        <div
          className={`${styles.countdownBlock} ${
            countdownUrgency === "danger"
              ? styles.countdownDanger
              : countdownUrgency === "warning"
              ? styles.countdownWarning
              : ""
          }`}
        >
          <p className={styles.countdownBlockLabel}>{countdownLabel}</p>

          <div className={styles.countdownUnits}>
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Min", value: countdown.minutes },
              { label: "Sec", value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label}>
                <h4>{String(unit.value).padStart(2, "0")}</h4>
                <span>{unit.label}</span>
              </div>
            ))}
          </div>
        </div>

        {action.href ? (
          <Link href={action.href} className={`${styles.action} ${styles[action.variant]}`}>
            {action.text}
          </Link>
        ) : (
          <button className={`${styles.action} ${styles.disabled}`} disabled>
            {action.text}
          </button>
        )}
      </div>

      <div className={styles.timelineSection}>
        <JourneyTimeline steps={steps} />
      </div>
    </motion.section>
  );
}
