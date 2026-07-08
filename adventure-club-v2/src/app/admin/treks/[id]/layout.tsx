import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import styles from "./layout.module.scss";
import TrekTabs from "@/components/admin/TrekTabs";
import PageHeader from "@/components/admin/shared/PageHeader";
import { CalendarDays, Mountain, Wallet, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getAdminAccessLevel, type AdminAccessLevel } from "@/lib/admin-access";

// Mirrors the sidebar's per-tier filtering, but keyed by tab title since a
// trek's tabs all share one URL prefix (/admin/treks/[id]/...) rather than
// each having its own top-level sidebar href.
const TABS_BY_ACCESS: Record<AdminAccessLevel, string[] | null> = {
  FULL: null,
  FINANCE: ["Finance", "Reports", "Refunds", "Booking", "Payments"],
  VISUAL: ["Booking", "Gallery"],
  BOOKING: ["Booking"],
  CORE: [],
  NONE: [],
};

export default async function TrekLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id },
  });

  if (!trek) {
    return <h1>Trek not found.</h1>;
  }

  const user = await getCurrentUser();
  const accessLevel = user ? getAdminAccessLevel(user) : "NONE";
  const allowedTabs = TABS_BY_ACCESS[accessLevel];

  const tabs = [
    { title: "Overview", href: `/admin/treks/${id}` },
    { title: "Registrations", href: `/admin/treks/${id}/registrations` },
    { title: "Payments", href: `/admin/treks/${id}/payments` },
    { title: "Attendance", href: `/admin/treks/${id}/attendance` },
    { title: "Trip Centre", href: `/admin/treks/${id}/trip-centre` },
    { title: "Booking", href: `/admin/treks/${id}/booking` },
    { title: "Refunds", href: `/admin/treks/${id}/refunds` },
    { title: "Finance", href: `/admin/treks/${id}/finance` },
    { title: "Gallery", href: `/admin/treks/${id}/gallery` },
    { title: "Reports", href: `/admin/treks/${id}/reports` },
  ].filter((tab) => !allowedTabs || allowedTabs.includes(tab.title));

  return (
    <div className={styles.container}>
      <PageHeader
        title={trek.title}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Treks", href: "/admin/treks" },
          { label: trek.title },
        ]}
      />

      <div className={styles.stats}>
        <span>
          <CalendarDays size={14} /> {new Date(trek.date).toLocaleDateString()}
        </span>
        <span>
          <Mountain size={14} /> {trek.difficulty}
        </span>
        <span>
          <Wallet size={14} /> ₹{trek.price}
        </span>
        <span>
          <Users size={14} /> {trek.seats} Seats
        </span>
      </div>

      <TrekTabs tabs={tabs} />

      <div className={styles.content}>{children}</div>
    </div>
  );
}
