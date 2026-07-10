"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, Radar, Satellite } from "lucide-react";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { TrailStat } from "@/types/homepage";
import styles from "./GoogleEarthExplorer.module.scss";

// Google Earth Web sends `X-Frame-Options: SAMEORIGIN` (confirmed directly
// against the real URL), so it can never be embedded in an <iframe> on this
// site — the browser enforces that from Google's side, not ours. It opens
// in a new tab instead, behind a full-screen "launch" takeover so it still
// feels like a single continuous moment rather than an abrupt tab switch.
// The link and trail stats below are admin-editable — see Admin →
// Settings → 3D Explorer.

const LOADING_STEPS = [
  "Initializing Satellite Data...",
  "Calibrating Altitudes...",
  "Ready to Fly!",
];

type Phase = "idle" | "loading" | "launched";

export default function GoogleEarthExplorer({
  earthUrl,
  trailStats,
}: {
  earthUrl: string;
  trailStats: TrailStat[];
}) {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);

  function openEarth() {
    if (!earthUrl) return;
    window.open(earthUrl, "_blank", "noopener,noreferrer");
  }

  function handleLaunch() {
    if (phase !== "idle" || !earthUrl) return;

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

                <button
                  type="button"
                  className={styles.launchButton}
                  onClick={handleLaunch}
                  disabled={!earthUrl}
                >
                  <Satellite size={18} />
                  {earthUrl ? "Launch 3D Fly-Through" : "Link Not Set Yet"}
                </button>

                {trailStats.length > 0 && (
                  <div className={styles.statsGrid}>
                    {trailStats.map((stat) => (
                      <div key={stat.id} className={styles.statBlock} data-tooltip={stat.tooltip}>
                        <span className={styles.statValue}>{stat.value}</span>
                        <span className={styles.statLabel}>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
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
