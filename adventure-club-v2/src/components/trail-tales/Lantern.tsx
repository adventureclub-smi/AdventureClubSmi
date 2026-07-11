"use client";

import { motion } from "framer-motion";
import styles from "./Lantern.module.scss";

export default function Lantern({ lit, jolted }: { lit: boolean; jolted: boolean }) {
  return (
    <motion.div
      className={styles.lantern}
      animate={jolted ? { rotate: [0, -6, 5, -3, 0], x: [0, -3, 3, -2, 0] } : { rotate: 0, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {lit && <div className={styles.glowHalo} aria-hidden="true" />}

      <svg viewBox="0 0 80 120" width="100%" height="100%">
        <path d="M 34 6 Q 40 -2 46 6" stroke="#8a8f98" strokeWidth={3} fill="none" strokeLinecap="round" />
        <rect x={30} y={4} width={20} height={8} rx={3} fill="#8a8f98" />

        <rect x={12} y={16} width={56} height={80} rx={10} fill="#2a2a2a" stroke="#4b4b4b" strokeWidth={2} />

        <rect x={18} y={22} width={44} height={68} rx={6} fill={lit ? "rgba(200,255,180,0.18)" : "rgba(255,255,255,0.03)"} />

        <motion.ellipse
          cx={40}
          cy={64}
          rx={14}
          ry={20}
          fill={lit ? "#c8ffb4" : "#3a3f3a"}
          animate={
            lit
              ? { ry: [20, 23, 18, 21, 20], opacity: [0.9, 1, 0.85, 1, 0.9] }
              : { ry: 20, opacity: 1 }
          }
          transition={{ duration: 1.4, repeat: lit ? Infinity : 0, ease: "easeInOut" }}
        />

        <rect x={10} y={92} width={60} height={10} rx={4} fill="#2a2a2a" stroke="#4b4b4b" strokeWidth={2} />
      </svg>
    </motion.div>
  );
}
