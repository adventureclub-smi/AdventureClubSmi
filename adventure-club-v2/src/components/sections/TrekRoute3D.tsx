"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Mountain } from "lucide-react";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import styles from "./TrekRoute3D.module.scss";

// Mapbox GL touches window/document/WebGL directly — never render it on the
// server, and only pull the (fairly heavy) map bundle in once the browser
// actually needs it, same isolation pattern as the Hero's Three.js scene.
const TrekRoute3DCanvas = dynamic(() => import("@/components/map/TrekRoute3DCanvas"), {
  ssr: false,
});

export default function TrekRoute3D() {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  return (
    <section className={styles.trekRoute3D} id="trek-route-3d">
      <motion.div ref={revealRef} style={revealStyle}>
        <div className={styles.headingWrap}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className={styles.eyebrow}>SIGNATURE ROUTE</span>
            <h2>Climb It Before You Climb It.</h2>
          </motion.div>
        </div>

        {hasToken ? (
          <div className={styles.mapWrap}>
            <TrekRoute3DCanvas />
          </div>
        ) : (
          <div className={styles.empty}>
            <Mountain size={30} />
            <h3>3D Route Map Coming Soon</h3>
            <p>This section needs a Mapbox token to render — check back soon.</p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
