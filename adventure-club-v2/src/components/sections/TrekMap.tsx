"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Compass, MapPin } from "lucide-react";

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
  const sectionRef = useRef<HTMLElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // The map tilts up out of the page like it's being unrolled, rather than
  // just fading in — scrubbed to its own scroll position so it settles
  // flat exactly as it reaches a comfortable reading spot in the viewport.
  const { scrollYProgress: mapProgress } = useScroll({
    target: mapWrapRef,
    offset: ["start 92%", "start 45%"],
  });
  const mapRotateX = useTransform(mapProgress, [0, 1], [18, 0]);
  const mapScale = useTransform(mapProgress, [0, 1], [0.86, 1]);
  const mapOpacity = useTransform(mapProgress, [0, 1], [0, 1]);

  // A compass needle that spins as you scroll through the whole section —
  // purely decorative, reinforcing the "where we've been" map theme.
  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const compassRotate = useTransform(sectionProgress, [0, 1], [0, 360]);

  return (
    <section className={styles.trekMap} id="trek-map" ref={sectionRef}>
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

          <motion.span
            className={styles.compass}
            aria-hidden="true"
            style={reducedMotion ? undefined : { rotate: compassRotate }}
          >
            <Compass size={22} />
          </motion.span>
        </div>

        {pins.length === 0 ? (
          <div className={styles.empty}>
            <MapPin size={30} />
            <h3>Map Coming Soon</h3>
            <p>Trek locations are being added. Check back soon.</p>
          </div>
        ) : (
          <motion.div
            ref={mapWrapRef}
            className={styles.mapWrap}
            style={
              reducedMotion
                ? undefined
                : {
                    rotateX: mapRotateX,
                    scale: mapScale,
                    opacity: mapOpacity,
                    transformPerspective: 1200,
                  }
            }
          >
            <TrekMapCanvas pins={pins} />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
