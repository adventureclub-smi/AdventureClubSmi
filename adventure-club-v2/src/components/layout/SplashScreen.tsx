"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { supportsWebGL } from "@/lib/supports-webgl";
import styles from "./SplashScreen.module.scss";

// Same "never touch a WebGL canvas during SSR" rule the hero's
// ConstellationField follows — the renderer needs a real <canvas> element.
const Logo3D = dynamic(() => import("./Logo3D"), { ssr: false });

const SESSION_KEY = "navira-splash-shown";
const LETTERS = "NAVIRA".split("");

// Fixed scatter of "stars" around the mark — hand-placed rather than random
// per render, so the field reads as a deliberate constellation instead of
// jittering between loads.
const PARTICLES = [
  { top: 16, left: 20, delay: 0, dur: 3.4 },
  { top: 24, left: 82, delay: 0.6, dur: 2.8 },
  { top: 12, left: 55, delay: 1.1, dur: 3.1 },
  { top: 38, left: 10, delay: 0.3, dur: 2.6 },
  { top: 34, left: 92, delay: 1.4, dur: 3.6 },
  { top: 62, left: 14, delay: 0.9, dur: 2.9 },
  { top: 70, left: 88, delay: 0.2, dur: 3.2 },
  { top: 82, left: 30, delay: 1.6, dur: 2.7 },
  { top: 86, left: 68, delay: 0.5, dur: 3.5 },
  { top: 50, left: 6, delay: 1.2, dur: 2.5 },
  { top: 48, left: 96, delay: 0.8, dur: 3.3 },
  { top: 8, left: 32, delay: 1.8, dur: 2.6 },
  { top: 92, left: 48, delay: 0.4, dur: 3.0 },
  { top: 58, left: 78, delay: 1.5, dur: 2.8 },
];

// Total lifetime, mount to fully gone, is a fixed 6s (reduced-motion gets a
// much shorter, near-instant version instead of skipping straight to 6s of
// stillness).
const HOLD_MS = 5350;
const EXIT_MS = 650;
const REDUCED_HOLD_MS = 650;
const REDUCED_EXIT_MS = 350;

export default function SplashScreen() {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setWebglOk(supportsWebGL());
    setIsMobile(window.innerWidth < 700);
  }, []);

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

    const holdMs = reducedMotion ? REDUCED_HOLD_MS : HOLD_MS;
    const exitMs = reducedMotion ? REDUCED_EXIT_MS : EXIT_MS;

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
          animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.06 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reducedMotion ? REDUCED_EXIT_MS / 1000 : EXIT_MS / 1000,
            ease: [0.65, 0, 0.35, 1],
          }}
        >
          <div className={styles.vignette} />
          <div className={styles.glow} />
          <div className={styles.scanlines} />

          {!reducedMotion && (
            <div className={styles.particles}>
              {PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className={styles.particle}
                  style={{
                    top: `${p.top}%`,
                    left: `${p.left}%`,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.dur}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className={styles.mark}>
            {!reducedMotion && webglOk ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={styles.canvasWrap}
              >
                <Logo3D dpr={isMobile ? 1 : [1, 2]} />
              </motion.div>
            ) : (
              <>
                <svg
                  className={styles.ringSvg}
                  viewBox="0 0 160 160"
                  aria-hidden="true"
                >
                  <motion.circle
                    className={styles.ring}
                    cx="80"
                    cy="80"
                    r="72"
                    fill="none"
                    strokeWidth="1.5"
                    initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 0.9, 0.55] }}
                    transition={{
                      pathLength: { duration: 1.15, delay: 0.05, ease: [0.65, 0, 0.35, 1] },
                      opacity: { duration: 1.15, delay: 0.05, times: [0, 0.15, 1] },
                    }}
                  />
                </svg>

                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.78 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reducedMotion ? 0.3 : 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className={styles.logo}
                >
                  <Image
                    src="/logo/logo-bluegreen.png"
                    alt="NAVIRA"
                    width={110}
                    height={62}
                    priority
                  />
                </motion.div>
              </>
            )}
          </div>

          <motion.div
            className={styles.wordmark}
            aria-label="NAVIRA"
            initial={reducedMotion ? false : { letterSpacing: "0.62em" }}
            animate={{ letterSpacing: "0.35em" }}
            transition={{ duration: reducedMotion ? 0 : 1.1, delay: reducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.6, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{
                  duration: reducedMotion ? 0.2 : 0.55,
                  delay: reducedMotion ? 0 : 0.4 + i * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: reducedMotion ? 0.1 : 1.05 }}
            className={styles.tagline}
          >
            Explore. Beyond. Limits.
          </motion.p>

          <div className={styles.bar}>
            <motion.div
              className={styles.barFill}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: reducedMotion ? 0.4 : 1.3,
                delay: reducedMotion ? 0 : 0.35,
                ease: [0.65, 0, 0.35, 1],
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
