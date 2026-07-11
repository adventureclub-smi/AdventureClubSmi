"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import StoryScenes from "./StoryScenes";
import styles from "./Stories.module.scss";

export default function Stories() {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  return (
    <section className={styles.stories} id="stories">
      <motion.div
        className={styles.container}
        ref={revealRef}
        style={revealStyle}
      >
        <motion.div
          className={styles.heading}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={styles.eyebrow}>STORIES</span>
          <h2>Every Journey Leaves A Mark.</h2>
        </motion.div>

        <StoryScenes />
      </motion.div>
    </section>
  );
}
