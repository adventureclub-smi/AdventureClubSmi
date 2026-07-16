"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, FileCheck, MapPin, CalendarDays, IndianRupee } from "lucide-react";

import BackButton from "./shared/BackButton";
import StatusBadge from "./shared/StatusBadge";
import JourneyTimeline from "./shared/JourneyTimeline";
import ReimbursementStatus from "./shared/ReimbursementStatus";
import {
  getJourneyAction,
  getJourneyBadge,
  getJourneySteps,
  getPaymentBadge,
  getPaymentRows,
  type RegistrationLike,
} from "@/lib/registration-journey";
import styles from "./TrekJourney.module.scss";

type Payment = {
  id: string;
  type: "INITIAL" | "FINAL";
  amount: number;
  status: "LOCKED" | "PENDING" | "PAID";
  paidAt?: string | null;
};

type Registration = RegistrationLike & {
  payments: Payment[];
  reimbursementAmount: number | null;
  reimbursementDone: boolean;
  reimbursementReceived: boolean;
  trek: {
    id: string;
    title: string;
    destination: string;
    date: string;
    coverImage?: string | null;
    difficulty: string;
    tripCentrePublished?: boolean;
    initialPayment: number;
    finalPayment: number;
    installments?: number;
    expectedReimbursementMin: number | null;
    expectedReimbursementMax: number | null;
  };
};

export default function TrekJourney({ registrationId }: { registrationId: string }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/my-registrations");
        const data = await res.json();
        if (!active) return;

        if (res.ok) {
          const match = (data as Registration[]).find((r) => r.id === registrationId);
          setRegistration(match || null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [registrationId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <BackButton href="/dashboard/treks" label="Back to My Treks" />
        <p className={styles.empty}>Loading...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className={styles.container}>
        <BackButton href="/dashboard/treks" label="Back to My Treks" />
        <div className={styles.notFound}>
          <h2>Trek not found.</h2>
          <p>This trek isn&apos;t linked to your account.</p>
        </div>
      </div>
    );
  }

  const badge = getJourneyBadge(registration);
  const payment = getPaymentBadge(registration);
  const action = getJourneyAction(registration.trek.id, registration);
  const paymentRows = getPaymentRows(registration);
  const steps = getJourneySteps(registration);

  const tripOver = registration.status === "COMPLETED" || registration.status === "MISSED";
  const eligibleForReimbursement =
    tripOver && (registration.finalPaymentPaid || registration.initialPaymentPaid);

  return (
    <div className={styles.container}>
      <BackButton href="/dashboard/treks" label="Back to My Treks" />

      <motion.section
        className={styles.header}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.imageWrap}>
          <Image
            src={registration.trek.coverImage || "/images/default-trek.jpg"}
            alt={registration.trek.title}
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            className={styles.image}
          />
          <div className={styles.overlay} />

          <div className={styles.headerContent}>
            <StatusBadge text={badge.text} tone={badge.tone} />
            <h1>{registration.trek.title}</h1>

            <div className={styles.meta}>
              <span>
                <MapPin size={14} /> {registration.trek.destination}
              </span>
              <span>
                <CalendarDays size={14} />{" "}
                {new Date(registration.trek.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span>{registration.trek.difficulty}</span>
            </div>
          </div>
        </div>
      </motion.section>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <h3>Payment Details</h3>

            <div className={styles.badgeRow}>
              <StatusBadge text={payment.text} tone={payment.tone} />
              <StatusBadge
                text={registration.attendanceMarked ? "Attended" : "Attendance Pending"}
                tone={registration.attendanceMarked ? "success" : "neutral"}
              />
              <StatusBadge
                text={registration.certificateIssued ? "Certificate Issued" : "No Certificate Yet"}
                tone={registration.certificateIssued ? "success" : "neutral"}
              />
            </div>

            <div className={styles.paymentDetails}>
              {paymentRows.map((row) => (
                <div key={row.label} className={styles.paymentRow}>
                  <div className={styles.paymentRowLabel}>
                    <IndianRupee size={13} />
                    <span>{row.label}</span>
                  </div>

                  <div className={styles.paymentRowValue}>
                    <strong>₹{row.amount}</strong>
                    <StatusBadge text={row.text} tone={row.tone} />
                  </div>

                  {row.paidAt && (
                    <span className={styles.paymentRowDate}>
                      Paid on{" "}
                      {new Date(row.paidAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              {action.href && action.variant === "tripCentre" && (
                <Link href={action.href} className={styles.primaryAction}>
                  <Compass size={15} /> Open Trip Centre
                </Link>
              )}

              {action.href && action.variant !== "tripCentre" && (
                <Link href={action.href} className={styles.primaryAction}>
                  {action.text}
                </Link>
              )}

              {registration.certificateIssued && action.variant !== "certificate" && (
                <Link href="/dashboard/certificates" className={styles.secondaryAction}>
                  <FileCheck size={15} /> View Certificate
                </Link>
              )}
            </div>
          </section>

          {eligibleForReimbursement && (
            <section className={styles.card}>
              <h3>Reimbursement</h3>

              <ReimbursementStatus
                registrationId={registration.id}
                reimbursementAmount={registration.reimbursementAmount}
                reimbursementDone={registration.reimbursementDone}
                reimbursementReceived={registration.reimbursementReceived}
                expectedMin={registration.trek.expectedReimbursementMin}
                expectedMax={registration.trek.expectedReimbursementMax}
              />
            </section>
          )}
        </div>

        <div className={styles.sideColumn}>
          <section className={styles.card}>
            <JourneyTimeline steps={steps} />
          </section>
        </div>
      </div>
    </div>
  );
}
