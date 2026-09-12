"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import styles from "./SplashScreen.module.scss";

const SESSION_KEY = "navira-splash-shown";
const LETTERS = "NAVIRA".split("");

export default function SplashScreen() {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only the very first load in a browser tab gets the full cinematic
    // intro — every page after that, and every refresh within the same
    // session, skips straight past it instead of replaying on someone
    // who's already using the site.
    if (sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");

    document.body.style.overflow = "hidden";

    const holdMs = reducedMotion ? 700 : 1900;
    const exitMs = reducedMotion ? 400 : 650;

    const exitTimer = setTimeout(() => setExiting(true), holdMs);
    const doneTimer = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, holdMs + exitMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = "";
    };
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.splash}
          animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.05 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.4 : 0.65, ease: [0.65, 0, 0.35, 1] }}
        >
          <div className={styles.glow} />
          <div className={styles.scanlines} />

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reducedMotion ? 0.3 : 0.75, ease: [0.16, 1, 0.3, 1] }}
            className={styles.logo}
          >
            <Image
              src="/logo/logo-bluegreen.png"
              alt="NAVIRA"
              width={120}
              height={68}
              priority
            />
          </motion.div>

          <div className={styles.wordmark} aria-label="NAVIRA">
            {LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                initial={reducedMotion ? false : { opacity: 0, y: 26, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: reducedMotion ? 0.2 : 0.6,
                  delay: reducedMotion ? 0 : 0.35 + i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: reducedMotion ? 0.1 : 0.95 }}
            className={styles.tagline}
          >
            Explore. Beyond. Limits.
          </motion.p>

          <motion.div
            className={styles.bar}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: reducedMotion ? 0.4 : 1.4,
              delay: reducedMotion ? 0 : 0.3,
              ease: [0.65, 0, 0.35, 1],
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
