"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Mountain,
  ClipboardList,
  Wallet,
  Clock,
  CheckSquare,
  Award,
  IndianRupee,
  CalendarClock,
  Sparkles,
} from "lucide-react";

import StatCard from "@/components/dashboard/shared/StatCard";
import styles from "./AdminStats.module.scss";

type Stats = {
  users: number;
  activeTreks: number;
  registrations: number;
  paymentsReceived: number;
  revenue: number;
  pendingPayments: number;
  attendancePending: number;
  certificatesIssued: number;
  upcomingDeadlines: number;
  portfolioEntries: number;
};

export default function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok || !active) return;
        setStats(await res.json());
      } catch {
        // non-critical
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (!stats) return null;

  return (
    <div className={styles.grid}>
      <StatCard icon={Users} value={stats.users} label="Total Students" delay={0} />
      <StatCard icon={Mountain} value={stats.activeTreks} label="Active Treks" delay={0.03} />
      <StatCard
        icon={ClipboardList}
        value={stats.registrations}
        label="Registrations"
        delay={0.06}
      />
      <StatCard
        icon={Wallet}
        value={stats.paymentsReceived}
        label="Payments Received"
        delay={0.09}
      />
      <StatCard
        icon={IndianRupee}
        value={stats.revenue}
        prefix="₹"
        label="Revenue"
        delay={0.12}
      />
      <StatCard
        icon={Clock}
        value={stats.pendingPayments}
        label="Pending Payments"
        delay={0.15}
      />
      <StatCard
        icon={CheckSquare}
        value={stats.attendancePending}
        label="Attendance Pending"
        delay={0.18}
      />
      <StatCard
        icon={Award}
        value={stats.certificatesIssued}
        label="Certificates Issued"
        delay={0.21}
      />
      <StatCard
        icon={CalendarClock}
        value={stats.upcomingDeadlines}
        label="Upcoming Deadlines"
        delay={0.24}
      />
      <StatCard
        icon={Sparkles}
        value={stats.portfolioEntries}
        label="Portfolio Entries"
        delay={0.27}
      />
    </div>
  );
}
