"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { TrailStat } from "@/types/homepage";
import styles from "./TrekRoute3D.module.scss";

// MapLibre touches window/document/WebGL directly — never render it on the
// server, and only pull the map bundle in once the browser actually needs
// it, same isolation pattern as the Hero's Three.js scene and the 2D
// Leaflet trek map.
const TrekRoute3DCanvas = dynamic(() => import("@/components/map/TrekRoute3DCanvas"), {
  ssr: false,
});

export default function TrekRoute3D({ trailStats }: { trailStats: TrailStat[] }) {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  return (
    <section className={styles.explorer} id="trek-route-3d">
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

        <div className={styles.mapWrap}>
          <TrekRoute3DCanvas />
        </div>

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
    </section>
  );
}
