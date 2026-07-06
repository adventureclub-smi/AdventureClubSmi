"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./Navbar.module.scss";

const links = [
  { name: "Home", href: "/" },
  { name: "Treks", href: "#treks" },
  { name: "Gallery", href: "#gallery" },
  { name: "Stories", href: "#stories" },
  { name: "Tribe", href: "/tribe" },
];

export default function Navbar() {
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
      </motion.nav>
    </header>
  );
}