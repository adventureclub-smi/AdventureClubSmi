"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./AuthLayout.module.scss";

interface Props {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: Props) {
  return (
    <section className={styles.wrapper}>
      {/* Background Video */}

      <video
        autoPlay
        muted
        loop
        playsInline
        className={styles.video}
      >
        <source src="/videos/hero-compressed.mp4" type="video/mp4" />
      </video>

      <div className={styles.overlay} />

      <Link href="/" className={styles.backHome}>
        <ArrowLeft size={14} /> Back to Home
      </Link>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
      >
        {/* Logo */}

        <Image
          src="/logo/logo-white.png"
          alt="Adventure Club"
          width={80}
          height={80}
          className={styles.logo}
        />

        <span className={styles.club}>
          SRISHTI MANIPAL
        </span>

        <h1>{title}</h1>

        <p>{subtitle}</p>

        {children}
      </motion.div>
    </section>
  );
}