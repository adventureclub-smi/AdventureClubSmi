"use client";

import {
  Mountain,
  Compass,
  Wallet,
  CheckSquare,
  Award,
  Megaphone,
  BarChart3,
  Sparkles,
  Tent,
} from "lucide-react";

import AdminWelcome from "./AdminWelcome";
import AdminStats from "./AdminStats";
import RecentRegistrations from "./RecentRegistrations";
import ActiveTrekCard from "./ActiveTrekCard";
import RecentActivity from "./RecentActivity";
import OperationsOverview from "./OperationsOverview";
import Analytics from "./Analytics";
import QuickActionCard from "@/components/dashboard/shared/QuickActionCard";

import styles from "./AdminDashboard.module.scss";

const quickActions = [
  { href: "/admin/create-trek", label: "Create Trek", icon: Mountain },
  { href: "/admin/create-workshop", label: "Create Workshop", icon: Tent },
  { href: "/admin/treks", label: "Launch Trip Centre", icon: Compass },
  { href: "/admin/payments", label: "Verify Payments", icon: Wallet },
  { href: "/admin/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/admin/certificates", label: "Issue Certificates", icon: Award },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/portfolio", label: "Portfolio", icon: Sparkles },
];

export default function AdminDashboard() {
  return (
    <div className={styles.main}>
      <AdminWelcome />

      <AdminStats />

      <ActiveTrekCard />

      <section>
        <h2 className={styles.sectionHeading}>Quick Actions</h2>

        <div className={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.href}
              icon={action.icon}
              label={action.label}
              href={action.href}
            />
          ))}
        </div>
      </section>

      <OperationsOverview />

      <div className={styles.grid}>
        <RecentActivity />
        <RecentRegistrations />
      </div>

      <Analytics />
    </div>
  );
}
