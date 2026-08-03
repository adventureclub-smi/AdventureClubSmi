"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Menu, X, Download } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import styles from "./Navbar.module.scss";

const links = [
  { name: "Home", href: "/" },
  { name: "Treks", href: "/#treks" },
  { name: "Gallery", href: "/gallery" },
  { name: "Stories", href: "/#stories" },
  { name: "Tribe", href: "/tribe" },
  { name: "Contact Us", href: "/contact" },
];

// Matches the CSS breakpoint below where the full menu collapses into the
// hamburger trigger — hide-on-scroll-down only makes sense once the navbar
// is the compact mobile bar, not the full desktop layout.
const MOBILE_BREAKPOINT = 1150;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  const lastScrollY = useRef(0);
  const { canInstall, promptInstall } = useInstallPrompt();
  const { scrollY } = useScroll();

  useEffect(() => {
    function updateIsMobile() {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    }

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  // The login cookie already lasts 7 days regardless of "Remember me" (it's
  // httpOnly, so this is the only way a client component can find out
  // whether that cookie is still valid) — a returning, already-logged-in
  // visitor should land straight on their dashboard instead of being shown
  // "Login" again every single visit.
  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setDashboardHref(data.loggedIn ? (data.clubRole === "Admin" ? "/admin" : "/dashboard") : null);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const delta = latest - lastScrollY.current;
    lastScrollY.current = latest;

    // Desktop keeps the navbar always visible; the drawer being open would
    // otherwise look broken if the bar it's anchored to slides away under it.
    if (!isMobile || open) {
      setHidden(false);
      return;
    }

    // Never hide right near the top — only once there's real distance to
    // scroll back up through does hiding actually save the user anything.
    if (latest < 80) {
      setHidden(false);
    } else if (delta > 4) {
      setHidden(true);
    } else if (delta < -4) {
      setHidden(false);
    }
  });

  return (
    <header className={styles.header}>
      <motion.nav
        className={styles.navbar}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: hidden ? -120 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* LEFT SIDE */}

        <div className={styles.brandGroup}>
          <Link href="/" className={styles.left}>
            <Image
              src="/logo/logo-bluegreen.png"
              alt="NAVIRA"
              width={72}
              height={41}
            />

            <Image
              src="/logo/clubname-typography.png"
              alt="NAVIRA"
              width={131}
              height={22}
              className={styles.navira}
            />
          </Link>

          <div className={styles.college}>
            <Image
              src="/logo/srishti-logo.png"
              alt="Srishti"
              width={92}
              height={42}
            />

            <div className={styles.collegeText}>
              <h4>Srishti Manipal Institute</h4>
              <span>Art, Design & Technology</span>
            </div>
          </div>
        </div>

        {/* MENU */}

        <ul className={styles.menu}>
          {links.map((item) => (
            <li key={item.name}>
              <Link href={item.href}>{item.name}</Link>
            </li>
          ))}
        </ul>

        {/* BUTTONS */}

        <div className={styles.actions}>
          {canInstall && (
            <button
              type="button"
              className={styles.install}
              onClick={promptInstall}
            >
              <Download size={16} />
              Download App
            </button>
          )}

          {dashboardHref ? (
            <Link href={dashboardHref} className={styles.join}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={styles.login}>
                Login
              </Link>

              <Link href="/signup" className={styles.join}>
                Join Club
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TRIGGER */}

        <button
          type="button"
          className={styles.menuTrigger}
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.drawerOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className={styles.drawer}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.drawerHeader}>
                <Image
                  src="/logo/logo-bluegreen.png"
                  alt="NAVIRA"
                  width={52}
                  height={29}
                />

                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X size={22} />
                </button>
              </div>

              <ul className={styles.drawerMenu}>
                {links.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} onClick={() => setOpen(false)}>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className={styles.drawerActions}>
                {canInstall && (
                  <button
                    type="button"
                    className={styles.install}
                    onClick={() => {
                      promptInstall();
                      setOpen(false);
                    }}
                  >
                    <Download size={16} />
                    Download App
                  </button>
                )}

                {dashboardHref ? (
                  <Link
                    href={dashboardHref}
                    className={styles.join}
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={styles.login}
                      onClick={() => setOpen(false)}
                    >
                      Login
                    </Link>

                    <Link
                      href="/signup"
                      className={styles.join}
                      onClick={() => setOpen(false)}
                    >
                      Join Club
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}