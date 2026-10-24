"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Mountain,
  Tent,
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
  PiggyBank,
  Vote,
  GraduationCap,
  LogOut,
  Menu,
  X,
  MessageCircle,
  Mail,
  UserPlus,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import type { AdminAccessLevel } from "@/lib/admin-access";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import styles from "./AdminSidebar.module.scss";

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; icon: LucideIcon; children: NavLink[] };
type NavItem = NavLink | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

const links: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Student Dashboard", icon: GraduationCap },
  {
    label: "Treks & Workshops",
    icon: Mountain,
    children: [
      { href: "/admin/treks", label: "Treks", icon: Mountain },
      { href: "/admin/workshops", label: "Workshops/Sessions", icon: Tent },
    ],
  },
  { href: "/admin/members", label: "Students", icon: Users },
  { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admin/recruitment", label: "Recruitment", icon: UserPlus },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/finance", label: "Finance", icon: PiggyBank },
  { href: "/admin/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/email", label: "Email Students", icon: Mail },
  { href: "/admin/contact", label: "Contact", icon: MessageCircle },
  { href: "/admin/portfolio", label: "Portfolio", icon: Sparkles },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/booking", label: "Booking", icon: Ticket },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Kept out of `links`/LINKS_BY_ACCESS deliberately — visibility of this one
// item is governed by club role, not by operational access tier (see
// src/lib/core-team.ts), so it's appended separately below rather than
// through the tier-based filtering every other link goes through.
//
// Temporarily disabled site-wide (not appended in visibleLinks below, and
// the route itself redirects — see app/admin/core-team-restructure/page.tsx)
// while the feature is on hold. Nothing else here was touched, so
// re-enabling is just: re-add `, CORE_TEAM_LINK` to visibleLinks and restore
// that page.
const CORE_TEAM_LINK = {
  href: "/admin/core-team-restructure",
  label: "Core Team Restructure",
  icon: Vote,
};

// Restricted access tiers only ever see the single nav item matching the
// one area they're scoped to; FULL (and legacy admins with no tier set)
// keeps today's complete nav. CORE has no tier-based link of its own — its
// only capability is the club-role-gated Core Team Restructure link below.
const LINKS_BY_ACCESS: Record<AdminAccessLevel, string[] | null> = {
  FULL: null,
  FINANCE: ["/admin/payments", "/admin/finance"],
  VISUAL: ["/admin/gallery"],
  BOOKING: ["/admin/booking"],
  CORE: [],
  NONE: [],
};

export default function AdminSidebar({
  accessLevel,
  clubRole,
}: {
  accessLevel: AdminAccessLevel;
  clubRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const allowedHrefs = LINKS_BY_ACCESS[accessLevel];
  const tierLinks = allowedHrefs
    ? links.filter((link) =>
        isGroup(link)
          ? link.children.some((child) => allowedHrefs.includes(child.href))
          : allowedHrefs.includes(link.href)
      )
    : links;

  const visibleLinks = tierLinks;

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
        pathname.startsWith("/admin/create-historical-trek") ||
        pathname.startsWith("/admin/edit-trek")
      );
    }

    if (href === "/admin/workshops") {
      return (
        pathname.startsWith("/admin/workshops") ||
        pathname.startsWith("/admin/create-workshop") ||
        pathname.startsWith("/admin/edit-workshop")
      );
    }

    return pathname.startsWith(href);
  }

  function isGroupActive(group: NavGroup) {
    return group.children.some((child) => isActive(child.href));
  }

  function isGroupExpanded(group: NavGroup) {
    const override = expandedGroups[group.label];
    return override !== undefined ? override : isGroupActive(group);
  }

  function toggleGroup(group: NavGroup) {
    setExpandedGroups((prev) => ({ ...prev, [group.label]: !isGroupExpanded(group) }));
  }

  const nav = (
    <nav className={styles.nav}>
      {visibleLinks.map((item) => {
        if (isGroup(item)) {
          const expanded = isGroupExpanded(item);

          return (
            <div key={item.label} className={styles.navGroup}>
              <button
                type="button"
                className={isGroupActive(item) ? styles.groupActive : ""}
                onClick={() => toggleGroup(item)}
                aria-expanded={expanded}
              >
                <item.icon size={19} />
                {item.label}
                <ChevronDown size={16} className={expanded ? styles.chevronOpen : ""} />
              </button>

              {expanded && (
                <div className={styles.navGroupChildren}>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={isActive(child.href) ? styles.active : ""}
                      onClick={() => setOpen(false)}
                    >
                      <child.icon size={17} />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Every other link stays inside the admin panel — this one jumps
        // out to the regular member-facing dashboard, a different enough
        // action (and destination) that it shouldn't blend in as just
        // another admin section.
        const isSwitchView = item.href === "/dashboard";

        const classes = [
          isSwitchView ? styles.switchView : "",
          isActive(item.href) ? styles.active : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={classes}
            onClick={() => setOpen(false)}
          >
            <item.icon size={19} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className={styles.sidebar} data-no-print>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo/logo-bluegreen.png"
            alt="NAVIRA"
            width={54}
            height={31}
            priority
          />

          <div>
            <Image
              src="/logo/clubname-typography.png"
              alt="NAVIRA"
              width={119}
              height={20}
              className={styles.clubname}
            />
            <p>Admin Panel</p>
          </div>
        </Link>

        {nav}

        <button className={styles.logout} onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <div className={styles.mobileTopBar} data-no-print>
        <button
          className={styles.menuButton}
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
          Menu
        </button>

        <Link href="/" aria-label="Go to homepage" className={styles.mobileLogo}>
          <Image
            src="/logo/logo-bluegreen.png"
            alt="NAVIRA"
            width={28}
            height={16}
          />
        </Link>

        <button aria-label="Logout" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {open && (
        <div className={styles.drawerOverlay} onClick={() => setOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span>NAVIRA Admin</span>
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
