"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, Radar, Satellite } from "lucide-react";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import styles from "./GoogleEarthExplorer.module.scss";

// ===== EDIT ME: your Google Earth project link =====
// Share a Google Earth "My Maps"/project link (Earth Web → Present →
// Share) and drop it in here. Google Earth Web sends
// `X-Frame-Options: SAMEORIGIN` (confirmed directly against the real
// URL), so it can never be embedded in an <iframe> on this site — the
// browser enforces that from Google's side, not ours. It opens in a
// new tab instead, behind a full-screen "launch" takeover so it still
// feels like a single continuous moment rather than an abrupt tab switch.
const GOOGLE_EARTH_URL =
  "https://earth.google.com/earth/d/1z46-fpwZCjtVgQ_L0pUMVTx18ZedN8LI?usp=sharing";

const LOADING_STEPS = [
  "Initializing Satellite Data...",
  "Calibrating Altitudes...",
  "Ready to Fly!",
];

// ===== EDIT ME: trail stats =====
// Quirky, real-ish trail stats for the tactical grid. Swap in real
// numbers for whichever trek this launch card is fronting.
const TRAIL_STATS = [
  { label: "Max Elevation", value: "1,450m", tooltip: "Higher than your motivation at 6am." },
  { label: "Maggi Points En Route", value: "2", tooltip: "The real summit, if we're honest." },
  { label: "Cellular Signal", value: "Patchy at Best", tooltip: "Peace of mind, whether you want it or not." },
  { label: "Sunrise Views", value: "Guaranteed", tooltip: "Weather gods permitting." },
  { label: "Descent Time", value: "~45 min", tooltip: "Faster if your knees still work." },
  { label: "Best Season", value: "Oct – Feb", tooltip: "Anything else and you're just suffering." },
];

type Phase = "idle" | "loading" | "launched";

export default function GoogleEarthExplorer() {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);

  function openEarth() {
    window.open(GOOGLE_EARTH_URL, "_blank", "noopener,noreferrer");
  }

  function handleLaunch() {
    if (phase !== "idle") return;

    setPhase("loading");
    setStepIndex(0);

    const stepDuration = 500;

    LOADING_STEPS.forEach((_, i) => {
      if (i === 0) return;
      setTimeout(() => setStepIndex(i), stepDuration * i);
    });

    setTimeout(() => {
      setPhase("launched");
      openEarth();
    }, stepDuration * LOADING_STEPS.length);
  }

  function handleClose() {
    setPhase("idle");
    setStepIndex(0);
  }

  return (
    <section className={styles.explorer} id="google-earth-explorer">
      <motion.div ref={revealRef} style={revealStyle}>
        <div className={styles.headingWrap}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className={styles.eyebrow}>SIGNATURE ROUTE</span>
            <h2>Fly The Route Before You Hike It.</h2>
          </motion.div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardBg} />
          <div className={styles.cardScrim} />

          <AnimatePresence>
            {phase === "idle" && (
              <motion.div
                className={styles.cardContent}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              >
                <div className={styles.radarBadge}>
                  <span className={styles.radarDot} />
                  3D TRAIL RADAR ACTIVE
                </div>

                <button type="button" className={styles.launchButton} onClick={handleLaunch}>
                  <Satellite size={18} />
                  Launch 3D Fly-Through
                </button>

                <div className={styles.statsGrid}>
                  {TRAIL_STATS.map((stat) => (
                    <div key={stat.label} className={styles.statBlock} data-tooltip={stat.tooltip}>
                      <span className={styles.statValue}>{stat.value}</span>
                      <span className={styles.statLabel}>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === "loading" && (
              <motion.div
                className={styles.loadingOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={styles.radarSweep}>
                  <Radar size={28} />
                </div>
                <p className={styles.loadingText}>{LOADING_STEPS[stepIndex]}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {phase === "launched" && (
          <motion.div
            className={styles.launchedOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.launchedCard}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.launchedGlobe}>
                <Globe2 size={32} />
              </div>

              <h3>Fly-Through Launched</h3>
              <p>
                Your 3D route opened in a new tab. Didn&apos;t see it? Your browser may have
                blocked the popup.
              </p>

              <div className={styles.launchedActions}>
                <button type="button" className={styles.relaunchButton} onClick={openEarth}>
                  Relaunch In New Tab
                </button>

                <button type="button" className={styles.closeButton} onClick={handleClose}>
                  Return To Base
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
