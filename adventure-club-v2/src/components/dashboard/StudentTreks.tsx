"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, ArrowUpRight, Archive } from "lucide-react";

import BackButton from "./shared/BackButton";
import StatusBadge from "./shared/StatusBadge";
import ReimbursementStatus from "./shared/ReimbursementStatus";
import {
  getJourneyBadge,
  registrationStateFor,
  type RegistrationLike,
} from "@/lib/registration-journey";
import { HISTORICAL_SEASONS, getCurrentSeasonLabel } from "@/lib/historical-seasons";
import styles from "./StudentTreks.module.scss";

type Registration = RegistrationLike & {
  reimbursementAmount: number | null;
  reimbursementDone: boolean;
  reimbursementReceived: boolean;
};

type YearTrek = {
  id: string;
  title: string;
  destination: string;
  date: string;
  difficulty: string;
  coverImage?: string | null;
  expectedReimbursementMin: number | null;
  expectedReimbursementMax: number | null;
  isHistorical: boolean;
  season: string | null;
  registrationClosedManually: boolean;
  registrationOpenedManually: boolean;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
};

type Entry = {
  trek: YearTrek;
  registration: Registration | null;
};

export default function StudentTreks() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    let active = true;

    async function loadTreks() {
      try {
        const res = await fetch("/api/dashboard/year-treks");
        const data = await res.json();
        if (active && res.ok) setEntries(data?.entries ?? []);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTreks();

    return () => {
      active = false;
    };
  }, []);

  const currentSeasonLabel = useMemo(() => getCurrentSeasonLabel(), []);

  // Only offer archive tabs the club actually has treks backfilled for —
  // matches HISTORICAL_SEASONS, the same list the admin's import tooling
  // uses, so a season never shows up empty.
  const seasons = useMemo(
    () => HISTORICAL_SEASONS.filter((season) => entries.some((e) => e.trek.season === season)),
    [entries]
  );

  const visibleEntries = useMemo(
    () =>
      entries.filter((entry) =>
        activeTab === "current" ? !entry.trek.isHistorical : entry.trek.season === activeTab
      ),
    [entries, activeTab]
  );

  const registeredEntries = visibleEntries.filter((entry) => entry.registration);

  const unregisteredEntries = visibleEntries.filter((entry) => !entry.registration);

  // Registration still open (or a countdown to it opening) means the
  // student hasn't missed anything yet — that only belongs in "Didn't
  // Attend" once registration has actually closed with no sign-up from them.
  const registerEntries = unregisteredEntries.filter((entry) => {
    const state = registrationStateFor(entry.trek);
    return state === "OPEN" || state === "NOT_OPEN";
  });

  const notAttendedEntries = unregisteredEntries.filter(
    (entry) => registrationStateFor(entry.trek) === "CLOSED"
  );

  return (
    <div className={styles.container}>
      <BackButton />

      <h1>My Treks</h1>

      <div className={styles.tabs}>
        <button
          className={activeTab === "current" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("current")}
        >
          This Year {currentSeasonLabel}
        </button>

        {seasons.map((season) => (
          <button
            key={season}
            className={activeTab === season ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(season)}
          >
            <Archive size={13} /> {season}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.emptyText}>Loading...</p>
      ) : visibleEntries.length === 0 ? (
        <div className={styles.empty}>
          <h2>No treks yet.</h2>
          <p>Register for an upcoming trek to start your adventure journey.</p>
        </div>
      ) : (
        <>
          {registerEntries.length > 0 && (
            <section className={styles.group}>
              <h3 className={styles.groupHeading}>Register</h3>

              <div className={styles.grid}>
                {registerEntries.map((entry, i) => {
                  const state = registrationStateFor(entry.trek);
                  const badge = getJourneyBadge(null, state);

                  return (
                    <motion.div
                      key={entry.trek.id}
                      className={styles.card}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
                    >
                      <div className={styles.imageWrap}>
                        <Image
                          src={entry.trek.coverImage || "/images/default-trek.jpg"}
                          alt={entry.trek.title}
                          fill
                          sizes="(max-width: 700px) 100vw, 340px"
                          className={styles.image}
                        />
                        <div className={styles.badgeWrap}>
                          <StatusBadge text={badge.text} tone={badge.tone} />
                        </div>
                      </div>

                      <div className={styles.content}>
                        <h2>{entry.trek.title}</h2>

                        <p>
                          <MapPin size={13} /> {entry.trek.destination}
                        </p>

                        <p>
                          <CalendarDays size={13} />{" "}
                          {new Date(entry.trek.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>

                        <Link href={`/treks/${entry.trek.id}`} className={styles.openButton}>
                          {state === "NOT_OPEN" ? "View Trek" : "Register"} <ArrowUpRight size={15} />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {registeredEntries.length > 0 && (
            <section className={styles.group}>
              <h3 className={styles.groupHeading}>My Treks</h3>

              <div className={styles.grid}>
                {registeredEntries.map((entry, i) => {
                  const reg = entry.registration!;
                  const badge = getJourneyBadge(reg);

                  const tripOver = reg.status === "COMPLETED" || reg.status === "MISSED";
                  const eligibleForReimbursement =
                    tripOver && (reg.finalPaymentPaid || reg.initialPaymentPaid);

                  return (
                    <motion.div
                      key={entry.trek.id}
                      className={styles.card}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
                    >
                      <div className={styles.imageWrap}>
                        <Image
                          src={entry.trek.coverImage || "/images/default-trek.jpg"}
                          alt={entry.trek.title}
                          fill
                          sizes="(max-width: 700px) 100vw, 340px"
                          className={styles.image}
                        />
                        <div className={styles.badgeWrap}>
                          <StatusBadge text={badge.text} tone={badge.tone} />
                        </div>
                      </div>

                      <div className={styles.content}>
                        <h2>{entry.trek.title}</h2>

                        <p>
                          <MapPin size={13} /> {entry.trek.destination}
                        </p>

                        <p>
                          <CalendarDays size={13} />{" "}
                          {new Date(entry.trek.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>

                        {eligibleForReimbursement && (
                          <div className={styles.reimbursement}>
                            <ReimbursementStatus
                              registrationId={reg.id}
                              reimbursementAmount={reg.reimbursementAmount}
                              reimbursementDone={reg.reimbursementDone}
                              reimbursementReceived={reg.reimbursementReceived}
                              expectedMin={entry.trek.expectedReimbursementMin}
                              expectedMax={entry.trek.expectedReimbursementMax}
                            />
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
            </section>
          )}

          {notAttendedEntries.length > 0 && (
            <section className={styles.group}>
              <h3 className={styles.groupHeading}>Didn&apos;t Attend</h3>

              <div className={styles.compactGrid}>
                {notAttendedEntries.map((entry, i) => (
                  <motion.div
                    key={entry.trek.id}
                    className={styles.compactCard}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
                  >
                    <div className={styles.compactImageWrap}>
                      <Image
                        src={entry.trek.coverImage || "/images/default-trek.jpg"}
                        alt={entry.trek.title}
                        fill
                        sizes="180px"
                        className={styles.image}
                      />
                    </div>

                    <div className={styles.compactContent}>
                      <h2>{entry.trek.title}</h2>

                      <p>
                        <CalendarDays size={12} />{" "}
                        {new Date(entry.trek.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>

                      <StatusBadge text="Didn't Attend" tone="danger" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
