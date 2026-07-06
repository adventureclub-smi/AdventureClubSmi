"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { JourneyStep } from "@/lib/registration-journey";
import styles from "./JourneyTimeline.module.scss";

export default function JourneyTimeline({ steps }: { steps: JourneyStep[] }) {
  return (
    <div className={styles.timeline}>
      <h3>Adventure Journey</h3>

      <div className={styles.list}>
        {steps.map((step, i) => (
          <motion.div
            key={step.key}
            className={`${styles.item} ${
              step.current ? styles.current : ""
            }`}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <div
              className={
                step.done
                  ? styles.dotDone
                  : step.current
                  ? styles.dotCurrent
                  : styles.dotPending
              }
            >
              {step.done && <Check size={13} strokeWidth={3} />}
            </div>

            <div>
              <strong>{step.title}</strong>
              <p>{step.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
