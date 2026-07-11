"use client";

import { motion } from "framer-motion";
import styles from "./Clothesline.module.scss";

export default function Clothesline({ grown }: { grown: boolean }) {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <motion.div
        className={styles.rope}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: grown ? 1 : 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
