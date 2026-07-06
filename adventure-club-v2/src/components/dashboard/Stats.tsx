"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mountain,
  Footprints,
  Award,
  Route,
  TrendingUp,
  Sparkles,
  Trophy,
} from "lucide-react";

import StatCard from "./shared/StatCard";
import { getBadges, getPortfolioPoints } from "@/lib/portfolio";
import styles from "./Stats.module.scss";

type DashboardStats = {
  totalTreks: number;
  peaks: number;
  totalKm: number;
  totalNights: number;
  certificates: number;
  highestAltitude: number;
};

type RegistrationSummary = {
  status: string;
  trek: { date: string };
};

export default function Stats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTreks: 0,
    peaks: 0,
    totalKm: 0,
    totalNights: 0,
    certificates: 0,
    highestAltitude: 0,
  });

  const [upcomingTreks, setUpcomingTreks] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok || !active) return;
        setStats(await res.json());
      } catch (err) {
        console.error(err);
      }
    }

    async function loadUpcoming() {
      try {
        const res = await fetch("/api/my-registrations");
        if (!res.ok || !active) return;

        const registrations: RegistrationSummary[] = await res.json();
        const now = Date.now();

        setUpcomingTreks(
          registrations.filter(
            (r) =>
              r.status !== "REJECTED" &&
              r.status !== "COMPLETED" &&
              new Date(r.trek.date).getTime() >= now
          ).length
        );
      } catch (err) {
        console.error(err);
      }
    }

    loadStats();
    loadUpcoming();

    return () => {
      active = false;
    };
  }, []);

  const badgesEarned = getBadges(stats).filter((b) => b.achieved).length;
  const portfolioPoints = getPortfolioPoints(stats);

  const cards = [
    { icon: Route, value: upcomingTreks, suffix: "", label: "Upcoming Treks" },
    { icon: Footprints, value: stats.totalTreks, suffix: "", label: "Completed Treks" },
    { icon: Award, value: stats.certificates, suffix: "", label: "Certificates" },
    { icon: Sparkles, value: portfolioPoints, suffix: "", label: "Portfolio Points" },
    { icon: TrendingUp, value: stats.totalKm, suffix: " km", label: "Total Distance" },
    { icon: Mountain, value: stats.highestAltitude, suffix: " m", label: "Highest Peak" },
    { icon: Trophy, value: badgesEarned, suffix: "", label: "Badges Earned" },
  ];

  return (
    <section>
      <motion.h2
        className={styles.heading}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        Adventure Statistics
      </motion.h2>

      <div className={styles.grid}>
        {cards.map((card, i) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            value={card.value}
            suffix={card.suffix}
            label={card.label}
            delay={i * 0.06}
          />
        ))}
      </div>
    </section>
  );
}
