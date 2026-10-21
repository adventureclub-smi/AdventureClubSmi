"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  House,
  LayoutDashboard,
  User,
  Mountain,
  ClipboardList,
  Bell,
  Mail,
  ShieldCheck,
  LogOut,
  type LucideIcon,
} from "lucide-react";

import styles from "./Sidebar.module.scss";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobileLabel?: string;
};

// "Home" (the site's actual homepage, not this dashboard) sits right above
// Logout rather than up top next to Dashboard — up top it reads as if it
// means "dashboard home", which it isn't.
const mainLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/treks", label: "My Treks", icon: Mountain },
  {
    href: "/dashboard/my-registrations",
    label: "My Registrations",
    icon: ClipboardList,
  },
  { href: "/dashboard/announcements", label: "Announcements", icon: Bell },
  { href: "/contact", label: "Contact Us", icon: Mail },
];

const homeLink: NavLink = { href: "/", label: "Home Page", icon: House };

const adminLink: NavLink = { href: "/admin", label: "Admin Panel", icon: ShieldCheck };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkRole() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok || !active) return;
        const data = await res.json();
        setIsAdmin(data?.role === "admin");
      } catch {
        // non-critical
      }
    }

    checkRole();

    return () => {
      active = false;
    };
  }, []);

  const navLinks = isAdmin
    ? [...mainLinks, adminLink, homeLink]
    : [...mainLinks, homeLink];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard" || href === "/") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo/logo-bluegreen.png"
            alt="NAVIRA"
            width={70}
            height={40}
            priority
          />

          <div>
            <Image
              src="/logo/clubname-typography.png"
              alt="NAVIRA"
              width={131}
              height={22}
              className={styles.clubname}
            />
            <p>Srishti Manipal</p>
          </div>
        </Link>

        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? styles.active : ""}
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          ))}
        </nav>

        <button className={styles.logout} onClick={handleLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <nav className={styles.mobileNav}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(link.href) ? styles.mobileActive : ""}
          >
            <link.icon size={20} />
            <span>{link.mobileLabel || link.label.replace("My ", "")}</span>
          </Link>
        ))}

        <button type="button" onClick={handleLogout} className={styles.mobileLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
}
