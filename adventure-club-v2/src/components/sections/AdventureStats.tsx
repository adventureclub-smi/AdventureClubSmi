"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { StatItem } from "@/types/homepage";
import styles from "./AdventureStats.module.scss";

// Each stat tilts/scales itself in as it individually crosses the viewport
// rather than all firing off one shared section-level trigger — since
// they're laid out in a row, scrolling up feels like the numbers are
// flipping upright one after another instead of a single flat fade.
function StatCard({
  value,
  suffix,
  label,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const count = useCountUp(value, active);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "start 45%"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [55, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.7, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [70, 0]);

  return (
    <motion.div
      ref={ref}
      className={styles.statWrap}
      style={
        reducedMotion
          ? undefined
          : { rotateX, scale, opacity, y, transformPerspective: 800 }
      }
    >
      <div className={styles.stat}>
        <h3>
          {count}
          {suffix}
        </h3>
        <p>{label}</p>
      </div>
    </motion.div>
  );
}

export default function AdventureStats({ stats }: { stats: StatItem[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const orbAY = useTransform(scrollYProgress, [0, 1], [-60, 120]);
  const orbBY = useTransform(scrollYProgress, [0, 1], [80, -140]);

  return (
    <section className={styles.statistics} ref={ref}>
      <div className={styles.parallaxLayer} aria-hidden="true">
        <motion.div className={styles.orbA} style={{ y: orbAY }} />
        <motion.div className={styles.orbB} style={{ y: orbBY }} />
      </div>

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
          <span className={styles.eyebrow}>ADVENTURE BEGINS</span>
          <h2>By The Numbers.</h2>
        </motion.div>

        <div className={styles.grid}>
          {stats.map((stat) => (
            <StatCard
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              active={inView}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
