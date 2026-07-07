"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import styles from "./HeroSection.module.scss";

type Props = {
  name: string;
  clubId: string;
  membership: string;
  role: string;
  bannerImageUrl?: string | null;
  tripCentreHref?: string | null;
};

export default function HeroSection({
  name,
  clubId,
  membership,
  role,
  bannerImageUrl,
  tripCentreHref,
}: Props) {
  const hour = new Date().getHours();

  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <section className={styles.hero}>
      <Image
        src={bannerImageUrl || "/images/default-trek.jpg"}
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.banner}
      />

      <div className={styles.overlay} />

      <div className={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className={styles.eyebrow}>WELCOME BACK</p>

          <h1>
            {greeting}, <span>{name}</span>
          </h1>

          <p className={styles.subtitle}>
            Adventure awaits. Every summit begins with one step.
          </p>

          {tripCentreHref && (
            <Link href={tripCentreHref} className={styles.cta}>
              <Compass size={18} />
              Open Trip Centre
            </Link>
          )}
        </motion.div>

        <motion.div
          className={styles.memberCard}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div>
            <small>Membership</small>
            <h3>{membership}</h3>
          </div>

          <div>
            <small>Club Role</small>
            <h3>{role}</h3>
          </div>

          <div>
            <small>Club ID</small>
            <h3>{clubId}</h3>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
