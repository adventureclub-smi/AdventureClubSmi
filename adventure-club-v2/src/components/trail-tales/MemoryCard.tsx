"use client";

import { motion } from "framer-motion";
import type { Memory } from "./MemoryData";
import styles from "./MemoryCard.module.scss";

export default function MemoryCard({
  memory,
  index,
  visible,
  onOpen,
}: {
  memory: Memory;
  index: number;
  visible: boolean;
  onOpen: () => void;
}) {
  const swayDuration = 4.5 + (index % 3) * 0.6;
  const restRotate = index % 2 === 0 ? -3 : 3;

  return (
    <motion.button
      type="button"
      className={styles.card}
      onClick={onOpen}
      initial={{ opacity: 0, y: -140 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -140 }}
      transition={
        visible
          ? {
              delay: 0.15 * index,
              duration: 0.85,
              ease: [0.34, 1.56, 0.64, 1],
            }
          : { duration: 0.3 }
      }
    >
      <motion.div
        className={styles.swayWrap}
        animate={visible ? { rotate: [restRotate, -restRotate, restRotate] } : { rotate: 0 }}
        transition={{
          duration: swayDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.15 * index + 0.9,
        }}
      >
        <div className={styles.clip} aria-hidden="true" />

        <div className={styles.polaroid}>
          <div className={styles.illustration}>
            <span>{memory.emoji}</span>
          </div>

          <div className={styles.caption}>
            <strong>{memory.title}</strong>
            <span className={styles.meta}>
              {memory.tripType} • {memory.date}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
}
