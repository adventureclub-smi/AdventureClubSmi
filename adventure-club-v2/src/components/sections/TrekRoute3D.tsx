"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { UpcomingTrekRoute } from "@/types/homepage";
import styles from "./TrekRoute3D.module.scss";

// MapLibre touches window/document/WebGL directly — never render it on the
// server, and only pull the map bundle in once the browser actually needs
// it, same isolation pattern as the Hero's Three.js scene and the 2D
// Leaflet trek map.
const TrekRoute3DCanvas = dynamic(() => import("@/components/map/TrekRoute3DCanvas"), {
  ssr: false,
});

export default function TrekRoute3D({ routes }: { routes: UpcomingTrekRoute[] }) {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);
  const [selectedTrekId, setSelectedTrekId] = useState(routes[0]?.trekId ?? "");

  if (routes.length === 0) return null;

  const selectedRoute = routes.find((r) => r.trekId === selectedTrekId) ?? routes[0];

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
            <span className={styles.eyebrow}>UPCOMING TERRAIN</span>
            <h2>Preview The Ground Before You Cover It.</h2>
          </motion.div>
        </div>

        {routes.length > 1 && (
          <div className={styles.trekTabs}>
            {routes.map((route) => (
              <button
                key={route.trekId}
                type="button"
                className={route.trekId === selectedRoute.trekId ? styles.trekTabActive : styles.trekTab}
                onClick={() => setSelectedTrekId(route.trekId)}
              >
                {route.title}
              </button>
            ))}
          </div>
        )}

        <div className={styles.mapWrap}>
          <TrekRoute3DCanvas key={selectedRoute.trekId} waypoints={selectedRoute.waypoints} />
        </div>
      </motion.div>
    </section>
  );
}
