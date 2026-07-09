"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { TrekMapPin } from "@/types/homepage";
import styles from "./TrekMap.module.scss";

// Leaflet touches window/document directly — never render it on the server,
// and only pull the map bundle in once the browser actually needs it.
const TrekMapCanvas = dynamic(() => import("@/components/map/TrekMapCanvas"), {
  ssr: false,
});

export default function TrekMap({ pins }: { pins: TrekMapPin[] }) {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  return (
    <section className={styles.trekMap} id="trek-map">
      <motion.div ref={revealRef} style={revealStyle}>
        <div className={styles.headingWrap}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className={styles.eyebrow}>WHERE WE&apos;VE BEEN</span>
            <h2>Every Trail, One Map.</h2>
          </motion.div>
        </div>

        {pins.length === 0 ? (
          <div className={styles.empty}>
            <MapPin size={30} />
            <h3>Map Coming Soon</h3>
            <p>Trek locations are being added. Check back soon.</p>
          </div>
        ) : (
          <div className={styles.mapWrap}>
            <TrekMapCanvas pins={pins} />
          </div>
        )}
      </motion.div>
    </section>
  );
}
