"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import { useCountdown } from "@/hooks/useCountdown";
import { useRegistrationPhase } from "@/hooks/useRegistrationPhase";
import { useTilt } from "@/hooks/useTilt";
import { getJourneyAction, getJourneyBadge } from "@/lib/registration-journey";
import type { MyRegistrationSummary } from "@/data/treks";
import type { TrekSummary } from "@/types/homepage";
import styles from "./FeaturedTrekCard.module.scss";

function CountdownUnits({
  target,
  label,
}: {
  target: string | Date;
  label: string;
}) {
  const countdown = useCountdown(target);

  return (
    <div className={styles.countdownWrap}>
      <p className={styles.countdownLabel}>{label}</p>

      <div className={styles.countdown}>
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
  );
}

export default function FeaturedTrekCard({
  trek,
  badgeLabel,
  showCountdown,
  registration = null,
}: {
  trek: TrekSummary;
  badgeLabel: string;
  showCountdown: boolean;
  registration?: MyRegistrationSummary | null;
}) {
  const { phase, target, label } = useRegistrationPhase(
    trek.date,
    trek.registrationOpensAt
  );

  // Once the visitor is actually registered for this trek, the button (and
  // status) should reflect their real progress — Waiting Approval, Pay
  // Initial Payment, Waiting for Verification, Open Trip Centre, etc. —
  // the same journey logic the student dashboard uses, instead of always
  // showing "Register Now".
  const journeyBadge = registration ? getJourneyBadge(registration) : null;
  const journeyAction = registration
    ? getJourneyAction(trek.id, registration)
    : null;

  const cardRef = useRef<HTMLDivElement>(null);
  const tilt = useTilt(cardRef, 6);

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      ref={cardRef}
      style={tilt.style}
      {...tilt.handlers}
    >
      <div className={styles.imageWrap}>
        <Image
          src={trek.coverImage}
          alt={trek.title}
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          className={styles.image}
        />
        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <p className={styles.tag}>{badgeLabel}</p>

        <h3>{trek.title}</h3>

        <p className={styles.location}>{trek.destination}</p>

        <div className={styles.badges}>
          <span className={styles.badge}>{trek.difficulty}</span>
          <span
            className={
              trek.seatsLeft > 0 ? styles.badge : styles.badgeFull
            }
          >
            {trek.seatsLeft > 0 ? `${trek.seatsLeft} spots left` : "Full"}
          </span>

          {journeyBadge && journeyBadge.text && (
            <StatusBadge text={journeyBadge.text} tone={journeyBadge.tone} />
          )}
        </div>

        {showCountdown && <CountdownUnits target={target} label={label} />}

        {journeyAction ? (
          journeyAction.href ? (
            <Link href={journeyAction.href} className={styles.button}>
              {journeyAction.text}
            </Link>
          ) : (
            <span className={styles.buttonDisabled}>{journeyAction.text}</span>
          )
        ) : phase === "opensIn" ? (
          // Sends students to their dashboard while they wait — logging in
          // now means they're already signed in the moment registration
          // opens, instead of hitting a login wall right as the countdown
          // ends (the exact flow that broke registration for someone).
          <Link href="/dashboard" className={styles.button}>
            Open
          </Link>
        ) : (
          <Link href={`/treks/${trek.id}`} className={styles.button}>
            Register Now →
          </Link>
        )}
      </div>
    </motion.div>
  );
}
