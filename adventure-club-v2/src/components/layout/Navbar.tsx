"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import styles from "./Navbar.module.scss";

const links = [
  { name: "Home", href: "/" },
  { name: "Treks", href: "#treks" },
  { name: "Gallery", href: "#gallery" },
  { name: "Stories", href: "#stories" },
  { name: "Tribe", href: "/tribe" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <motion.nav
        className={styles.navbar}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* LEFT SIDE */}

        <div className={styles.brandGroup}>
          <Link href="/" className={styles.left}>
            <Image
              src="/logo/logo-white.png"
              alt="Adventure Club"
              width={50}
              height={50}
            />

            <div>
              <h3>Adventure Club</h3>
              <span>Srishti Manipal</span>
            </div>
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
          <Link href="/login" className={styles.login}>
            Login
          </Link>

          <Link href="/signup" className={styles.join}>
            Join Club
          </Link>
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
                  src="/logo/logo-white.png"
                  alt="Adventure Club"
                  width={36}
                  height={36}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}