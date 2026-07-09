"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Radar, Satellite } from "lucide-react";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import styles from "./GoogleEarthExplorer.module.scss";

// ===== EDIT ME: your Google Earth project link =====
// Share a Google Earth "My Maps"/project link (Earth Web → Present →
// Share) and drop it in here. Opens in a new tab after the loading
// sequence below.
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

export default function GoogleEarthExplorer() {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  const [launching, setLaunching] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  function handleLaunch() {
    if (launching) return;

    setLaunching(true);
    setStepIndex(0);

    const stepDuration = 500;

    LOADING_STEPS.forEach((_, i) => {
      if (i === 0) return;
      setTimeout(() => setStepIndex(i), stepDuration * i);
    });

    setTimeout(() => {
      window.open(GOOGLE_EARTH_URL, "_blank", "noopener,noreferrer");
      setLaunching(false);
      setStepIndex(0);
    }, stepDuration * LOADING_STEPS.length);
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

          <div className={styles.cardContent}>
            <div className={styles.radarBadge}>
              <span className={styles.radarDot} />
              3D TRAIL RADAR ACTIVE
            </div>

            <button
              type="button"
              className={styles.launchButton}
              onClick={handleLaunch}
              disabled={launching}
            >
              <Satellite size={18} />
              {launching ? "Launching..." : "Launch 3D Fly-Through"}
            </button>

            <div className={styles.statsGrid}>
              {TRAIL_STATS.map((stat) => (
                <div key={stat.label} className={styles.statBlock} data-tooltip={stat.tooltip}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {launching && (
            <div className={styles.loadingOverlay}>
              <div className={styles.radarSweep}>
                <Radar size={28} />
              </div>
              <p className={styles.loadingText}>{LOADING_STEPS[stepIndex]}</p>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
