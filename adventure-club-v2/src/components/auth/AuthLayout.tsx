"use client";

import { ReactNode, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLazyVideo } from "@/hooks/useLazyVideo";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  useLazyVideo(videoRef);

  return (
    <section className={styles.wrapper}>
      {/* Background Video */}

      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        className={styles.video}
      >
        <source
          src="https://media.adventureclubsmi.com/AdventureClub/HomepageVideos/d174c44d-10df-4aac-b45e-3964941c53c4.mp4"
          type="video/mp4"
        />
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