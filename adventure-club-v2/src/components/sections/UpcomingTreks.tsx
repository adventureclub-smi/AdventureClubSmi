"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Compass } from "lucide-react";
import FeaturedTrekCard from "./FeaturedTrekCard";
import TrekTile from "./TrekTile";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { MyRegistrationSummary } from "@/data/treks";
import type { TrekSummary, UpcomingTreksConfig } from "@/types/homepage";
import styles from "./UpcomingTreks.module.scss";

// Three.js touches the GPU/canvas — never render it on the server.
const AmbientField = dynamic(() => import("@/components/three/AmbientField"), {
  ssr: false,
});

export default function UpcomingTreks({
  treks,
  config,
}: {
  treks: TrekSummary[];
  config: UpcomingTreksConfig;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  // Pauses the ambient field's render loop once scrolled well past this
  // section, instead of letting it run for the rest of the page's lifetime.
  const sceneInView = useInView(sectionRef, { margin: "300px" });

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 700);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  // Fetched client-side rather than passed down from the server page — the
  // page itself is cached (ISR) since trek/gallery/etc. content is the same
  // for every visitor, but "my registration status" is genuinely per-visitor
  // and can't safely be baked into that shared cached HTML.
  const [myRegistrations, setMyRegistrations] = useState<MyRegistrationSummary[]>([]);

  useEffect(() => {
    let active = true;

    async function loadMyRegistrations() {
      try {
        const res = await fetch("/api/my-registrations");
        if (!active || !res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setMyRegistrations(data);
      } catch {
        // Anonymous visitor or a transient error — the section already
        // defaults to "Register Now" with no registration data.
      }
    }

    loadMyRegistrations();

    return () => {
      active = false;
    };
  }, []);

  const featured = config.featuredTrekId
    ? treks.find((trek) => trek.id === config.featuredTrekId) ?? treks[0]
    : treks[0];

  const rest = treks.filter((trek) => trek.id !== featured?.id);

  const featuredRegistration = featured
    ? myRegistrations.find((r) => r.trekId === featured.id) ?? null
    : null;

  return (
    <section className={styles.section} id="treks" ref={sectionRef}>
      <div className={styles.scene} aria-hidden="true">
        <AmbientField
          animate={!reducedMotion && sceneInView}
          isMobile={isMobile}
          density={0.6}
          shapes={false}
        />
      </div>

      <motion.div
        className={styles.container}
        ref={revealRef}
        style={revealStyle}
      >
        <div className={styles.heading}>
          <span className={styles.eyebrow}>{config.eyebrow}</span>
          <h2>{config.heading}</h2>
        </div>

        {!featured ? (
          <div className={styles.empty}>
            <Compass size={30} />
            <h3>Stay Tuned</h3>
            <p>The next adventure is being planned. Check back soon.</p>
          </div>
        ) : (
          <>
            <FeaturedTrekCard
              trek={featured}
              badgeLabel={config.featuredBadgeLabel}
              showCountdown={config.showFeaturedCountdown}
              registration={featuredRegistration}
            />

            {rest.length > 0 && (
              <div className={styles.grid}>
                {rest.map((trek, i) => (
                  <TrekTile key={trek.id} trek={trek} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </section>
  );
}
