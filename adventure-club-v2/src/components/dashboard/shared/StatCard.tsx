"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import styles from "./StatCard.module.scss";

export default function StatCard({
  icon: Icon,
  value,
  prefix = "",
  suffix = "",
  label,
  delay = 0,
}: {
  icon: LucideIcon;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const count = useCountUp(value, inView);

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className={styles.icon}>
        <Icon size={20} strokeWidth={1.75} />
      </div>

      <h3>
        {prefix}
        {count}
        {suffix}
      </h3>

      <p>{label}</p>
    </motion.div>
  );
}
