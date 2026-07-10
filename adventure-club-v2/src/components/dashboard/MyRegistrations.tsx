"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, FileCheck, MapPin, CalendarDays, IndianRupee } from "lucide-react";

import BackButton from "./shared/BackButton";
import StatusBadge from "./shared/StatusBadge";
import {
  getJourneyAction,
  getJourneyBadge,
  getPaymentBadge,
  getPaymentRows,
} from "@/lib/registration-journey";
import styles from "./MyRegistrations.module.scss";

type Payment = {
  id: string;
  type: "INITIAL" | "FINAL";
  amount: number;
  status: "LOCKED" | "PENDING" | "PAID";
  paymentMethod?: string | null;
  reference?: string | null;
  paidAt?: string | null;
  displayOverride?: string | null;
};

type Registration = {
  id: string;
  status: string;
  initialPaymentPaid: boolean;
  offlinePaymentCreated: boolean;
  offlinePaymentVerified: boolean;
  bondFormSubmitted: boolean;
  attendanceMarked: boolean;
  finalPaymentUnlocked: boolean;
  finalPaymentPaid: boolean;
  certificateIssued: boolean;
  initialPaymentDeadline?: string | null;
  payments: Payment[];
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
  };
};

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRegistrations() {
      try {
        const res = await fetch("/api/my-registrations");
        const data = await res.json();
        if (!active) return;

        if (res.ok) setRegistrations(data);
        else console.error(data.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRegistrations();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <BackButton />

      <h1 className={styles.heading}>My Registrations</h1>

      {loading ? (
        <p className={styles.empty}>Loading registrations...</p>
      ) : registrations.length === 0 ? (
        <p className={styles.empty}>No registrations yet — explore upcoming treks to get started.</p>
      ) : (
        <div className={styles.grid}>
          {registrations.map((reg, i) => {
            const statusBadge = getJourneyBadge(reg);
            const payment = getPaymentBadge(reg);
            const action = getJourneyAction(reg.trek.id, reg);
            const paymentRows = getPaymentRows(reg);

            return (
              <motion.div
                key={reg.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
              >
                <div className={styles.imageWrap}>
                  <Image
                    src={reg.trek.coverImage || "/images/default-trek.jpg"}
                    alt={reg.trek.title}
                    fill
                    sizes="(max-width: 700px) 100vw, 340px"
                    className={styles.image}
                  />
                  <div className={styles.overlay} />
                  <div className={styles.imageBadge}>
                    <StatusBadge text={statusBadge.text} tone={statusBadge.tone} />
                  </div>
                </div>

                <div className={styles.content}>
                  <h3>{reg.trek.title}</h3>

                  <p className={styles.meta}>
                    <MapPin size={13} /> {reg.trek.destination}
                  </p>

                  <p className={styles.meta}>
                    <CalendarDays size={13} />{" "}
                    {new Date(reg.trek.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  <div className={styles.badgeRow}>
                    <StatusBadge text={payment.text} tone={payment.tone} />
                    <StatusBadge
                      text={reg.attendanceMarked ? "Attended" : "Attendance Pending"}
                      tone={reg.attendanceMarked ? "success" : "neutral"}
                    />
                    <StatusBadge
                      text={reg.certificateIssued ? "Certificate Issued" : "No Certificate Yet"}
                      tone={reg.certificateIssued ? "success" : "neutral"}
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
                          <strong>{row.displayOverride ?? `₹${row.amount}`}</strong>
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

                    <Link href={`/treks/${reg.trek.id}`} className={styles.secondaryAction}>
                      View Details
                    </Link>

                    {reg.certificateIssued && (
                      <Link href="/dashboard/certificates" className={styles.secondaryAction}>
                        <FileCheck size={15} /> View Certificate
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
