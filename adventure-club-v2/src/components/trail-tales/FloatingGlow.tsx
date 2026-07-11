"use client";

import { motion } from "framer-motion";
import styles from "./FloatingGlow.module.scss";

export default function FloatingGlow({
  awake,
  originXPct,
}: {
  awake: boolean;
  originXPct: number;
}) {
  return (
    <div className={styles.layer} aria-hidden="true">
      <motion.div
        className={styles.ambient}
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className={styles.wake}
        style={{ left: `${originXPct}%` }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={
          awake
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.3 }
        }
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
    </div>
  );
}
