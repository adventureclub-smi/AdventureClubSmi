"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, ArrowUpRight, CheckCircle2 } from "lucide-react";

import BackButton from "./shared/BackButton";
import StatusBadge from "./shared/StatusBadge";
import { getJourneyBadge, type RegistrationLike } from "@/lib/registration-journey";
import styles from "./StudentTreks.module.scss";

type Registration = RegistrationLike & {
  reimbursementAmount: number | null;
  reimbursementDone: boolean;
  reimbursementReceived: boolean;
  trek: {
    id: string;
    title: string;
    destination: string;
    date: string;
    difficulty: string;
    coverImage?: string | null;
    expectedReimbursementMin: number | null;
    expectedReimbursementMax: number | null;
  };
};

export default function StudentTreks() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  async function handleMarkReceived(registrationId: string) {
    setMarkingId(registrationId);

    try {
      const res = await fetch(`/api/student/reimbursement/${registrationId}/received`, {
        method: "POST",
      });

      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === registrationId ? { ...r, reimbursementReceived: true } : r
          )
        );
      }
    } finally {
      setMarkingId(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadTreks() {
      try {
        const res = await fetch("/api/my-registrations");
        const data = await res.json();
        if (active && res.ok) setRegistrations(data);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTreks();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <BackButton />

      <h1>My Treks</h1>

      {loading ? (
        <p className={styles.emptyText}>Loading...</p>
      ) : registrations.length === 0 ? (
        <div className={styles.empty}>
          <h2>No treks yet.</h2>
          <p>Register for an upcoming trek to start your adventure journey.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {registrations.map((reg, i) => {
            const badge = getJourneyBadge(reg);

            const tripOver = reg.status === "COMPLETED" || reg.status === "MISSED";
            const eligibleForReimbursement =
              tripOver && (reg.finalPaymentPaid || reg.initialPaymentPaid);

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
                  <div className={styles.badgeWrap}>
                    <StatusBadge text={badge.text} tone={badge.tone} />
                  </div>
                </div>

                <div className={styles.content}>
                  <h2>{reg.trek.title}</h2>

                  <p>
                    <MapPin size={13} /> {reg.trek.destination}
                  </p>

                  <p>
                    <CalendarDays size={13} />{" "}
                    {new Date(reg.trek.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {eligibleForReimbursement && (
                    <div className={styles.reimbursement}>
                      {!reg.reimbursementDone ? (
                        <p className={styles.reimbursementPending}>
                          Reimbursement Pending
                          {(reg.trek.expectedReimbursementMin != null ||
                            reg.trek.expectedReimbursementMax != null) && (
                            <span>
                              {" "}
                              · Expected ₹{reg.trek.expectedReimbursementMin ?? "?"}–
                              {reg.trek.expectedReimbursementMax ?? "?"}
                            </span>
                          )}
                        </p>
                      ) : reg.reimbursementReceived ? (
                        <p className={styles.reimbursementReceived}>
                          <CheckCircle2 size={14} /> Reimbursement Received — ₹
                          {reg.reimbursementAmount ?? 0}
                        </p>
                      ) : (
                        <div className={styles.reimbursementDone}>
                          <p>
                            Reimbursement Done — ₹{reg.reimbursementAmount ?? 0}
                          </p>
                          <p className={styles.reimbursementNote}>
                            Please check and click below once you&apos;ve received it.
                          </p>
                          <button
                            type="button"
                            className={styles.receivedButton}
                            disabled={markingId === reg.id}
                            onClick={() => handleMarkReceived(reg.id)}
                          >
                            {markingId === reg.id ? "Marking..." : "Received"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <Link href={`/dashboard/treks/${reg.id}`} className={styles.openButton}>
                    Open <ArrowUpRight size={15} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
