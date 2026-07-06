"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mountain, Route, Sparkles, Footprints, MapPin, CalendarDays } from "lucide-react";

import BackButton from "./shared/BackButton";
import StatCard from "./shared/StatCard";
import type { Badge, PortfolioTotals } from "@/lib/portfolio";
import styles from "./Portfolio.module.scss";

type TrekHistoryItem = {
  id: string;
  title: string;
  destination: string;
  date: string;
  distanceKm: number;
  altitudeMeters: number;
  campNights: number;
  countsAsPeak: boolean;
};

type PortfolioData = {
  totals: PortfolioTotals;
  badges: Badge[];
  points: number;
  treks: TrekHistoryItem[];
};

export default function Portfolio() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/student/portfolio");
        if (!active) return;
        if (res.ok) setData(await res.json());
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <BackButton />

      <h1>Portfolio</h1>
      <p className={styles.subtitle}>
        A record of every summit, kilometre and camp night you&apos;ve earned.
      </p>

      {loading || !data ? (
        <p className={styles.empty}>Loading portfolio...</p>
      ) : (
        <>
          <div className={styles.statsRow}>
            <StatCard icon={Footprints} value={data.totals.totalTreks} label="Completed Treks" />
            <StatCard icon={Route} value={data.totals.totalKm} suffix=" km" label="Total Distance" />
            <StatCard icon={Mountain} value={data.totals.highestAltitude} suffix=" m" label="Highest Peak" />
            <StatCard icon={Sparkles} value={data.points} label="Portfolio Points" />
          </div>

          <section className={styles.section}>
            <h2>Badges</h2>

            <div className={styles.badgeGrid}>
              {data.badges.map((badge) => (
                <span
                  key={badge.id}
                  className={badge.achieved ? styles.badgeEarned : styles.badgeLocked}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Trek History</h2>

            {data.treks.length === 0 ? (
              <p className={styles.emptyInline}>
                No completed treks yet — your history will appear here once you finish your first adventure.
              </p>
            ) : (
              <div className={styles.trekGrid}>
                {data.treks.map((trek, i) => (
                  <motion.div
                    key={trek.id}
                    className={styles.trekCard}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
                  >
                    <h3>{trek.title}</h3>

                    <p>
                      <MapPin size={13} /> {trek.destination}
                    </p>

                    <p>
                      <CalendarDays size={13} />{" "}
                      {new Date(trek.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    <div className={styles.trekMetrics}>
                      <span>{trek.distanceKm} km</span>
                      <span>{trek.altitudeMeters} m</span>
                      <span>{trek.campNights} nights</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
