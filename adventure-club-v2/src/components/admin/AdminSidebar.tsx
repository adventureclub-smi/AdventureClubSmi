"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Mountain,
  Users,
  ClipboardList,
  Wallet,
  CheckSquare,
  Award,
  Megaphone,
  Sparkles,
  BarChart3,
  ImageIcon,
  Settings,
  Ticket,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import type { AdminAccessLevel } from "@/lib/admin-access";
import styles from "./AdminSidebar.module.scss";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/treks", label: "Treks", icon: Mountain },
  { href: "/admin/members", label: "Students", icon: Users },
  { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/portfolio", label: "Portfolio", icon: Sparkles },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/booking", label: "Booking", icon: Ticket },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Restricted access tiers only ever see the single nav item matching the
// one area they're scoped to; FULL (and legacy admins with no tier set)
// keeps today's complete nav.
const LINKS_BY_ACCESS: Record<AdminAccessLevel, string[] | null> = {
  FULL: null,
  FINANCE: ["/admin/payments"],
  VISUAL: ["/admin/gallery"],
  BOOKING: ["/admin/booking"],
  NONE: [],
};

export default function AdminSidebar({ accessLevel }: { accessLevel: AdminAccessLevel }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const allowedHrefs = LINKS_BY_ACCESS[accessLevel];
  const visibleLinks = allowedHrefs
    ? links.filter((link) => allowedHrefs.includes(link.href))
    : links;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";

    if (href === "/admin/treks") {
      return (
        pathname.startsWith("/admin/treks") ||
        pathname.startsWith("/admin/create-trek") ||
        pathname.startsWith("/admin/edit-trek")
      );
    }

    return pathname.startsWith(href);
  }

  const nav = (
    <nav className={styles.nav}>
      {visibleLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={isActive(link.href) ? styles.active : ""}
          onClick={() => setOpen(false)}
        >
          <link.icon size={19} />
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Image
            src="/logo/logo-white.png"
            alt="Adventure Club"
            width={54}
            height={54}
            priority
          />

          <div>
            <h2>Adventure Club</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        {nav}

        <button className={styles.logout} onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <div className={styles.mobileTopBar}>
        <button
          className={styles.menuButton}
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
          Menu
        </button>

        <Image
          src="/logo/logo-white.png"
          alt="Adventure Club"
          width={28}
          height={28}
        />

        <button aria-label="Logout" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {open && (
        <div className={styles.drawerOverlay} onClick={() => setOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span>Adventure Club Admin</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {nav}

            <button className={styles.logout} onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
