"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import styles from "./QuickActionCard.module.scss";

export default function QuickActionCard({
  icon: Icon,
  label,
  href,
  comingSoon = false,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  comingSoon?: boolean;
}) {
  const content = (
    <motion.div
      whileHover={comingSoon ? undefined : { y: -6 }}
      whileTap={comingSoon ? undefined : { scale: 0.97 }}
      className={`${styles.card} ${comingSoon ? styles.comingSoon : ""}`}
    >
      <div className={styles.icon}>
        <Icon size={22} strokeWidth={1.75} />
      </div>

      <span>{label}</span>

      {comingSoon && <em>Coming Soon</em>}
    </motion.div>
  );

  if (comingSoon) {
    return <div className={styles.wrapper}>{content}</div>;
  }

  return (
    <Link href={href} className={styles.wrapper}>
      {content}
    </Link>
  );
}
