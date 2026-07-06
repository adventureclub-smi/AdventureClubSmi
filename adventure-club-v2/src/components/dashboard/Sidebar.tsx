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
  ShieldCheck,
  LogOut,
} from "lucide-react";

import styles from "./Sidebar.module.scss";

const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/treks", label: "Treks", icon: Mountain },
  {
    href: "/dashboard/my-registrations",
    label: "My Registrations",
    icon: ClipboardList,
  },
  { href: "/dashboard/announcements", label: "Announcements", icon: Bell },
];

const adminLink = { href: "/admin", label: "Admin Panel", icon: ShieldCheck };

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

  const navLinks = isAdmin ? [...links, adminLink] : links;

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
        <div className={styles.logo}>
          <Image
            src="/logo/logo-white.png"
            alt="Adventure Club"
            width={70}
            height={70}
            priority
          />

          <div>
            <h2>Adventure Club</h2>
            <p>Srishti Manipal</p>
          </div>
        </div>

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

      <nav className={styles.mobileTopBar}>
        <Image
          src="/logo/logo-white.png"
          alt="Adventure Club"
          width={32}
          height={32}
        />
        <button onClick={handleLogout} aria-label="Logout">
          <LogOut size={20} />
        </button>
      </nav>

      <nav className={styles.mobileNav}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(link.href) ? styles.mobileActive : ""}
          >
            <link.icon size={20} />
            <span>{link.label.replace("My ", "")}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
