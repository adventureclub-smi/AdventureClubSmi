"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import FeaturedTrekCard from "./FeaturedTrekCard";
import TrekTile from "./TrekTile";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { MyRegistrationSummary } from "@/data/treks";
import type { TrekSummary, UpcomingTreksConfig } from "@/types/homepage";
import styles from "./UpcomingTreks.module.scss";

export default function UpcomingTreks({
  treks,
  config,
  myRegistrations = [],
}: {
  treks: TrekSummary[];
  config: UpcomingTreksConfig;
  myRegistrations?: MyRegistrationSummary[];
}) {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  const featured = config.featuredTrekId
    ? treks.find((trek) => trek.id === config.featuredTrekId) ?? treks[0]
    : treks[0];

  const rest = treks.filter((trek) => trek.id !== featured?.id);

  const featuredRegistration = featured
    ? myRegistrations.find((r) => r.trekId === featured.id) ?? null
    : null;

  return (
    <section className={styles.section} id="treks">
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
