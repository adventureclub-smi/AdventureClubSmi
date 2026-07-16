"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  Footprints,
  Gauge,
  Mountain,
  Sailboat,
  Sparkles,
  Sun,
  Tent,
  TreePine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { ActivityCard } from "@/types/homepage";
import styles from "./ThingsWeDo.module.scss";

const ICONS: Record<string, LucideIcon> = {
  mountain: Mountain,
  tent: Tent,
  flame: Flame,
  sailboat: Sailboat,
  "tree-pine": TreePine,
  footprints: Footprints,
  camera: Camera,
};

// Fixed, hand-picked positions rather than Math.random() — this renders on
// the server first, and randomizing per-render would mismatch the client's
// hydration pass.
const PARTICLES = [
  { left: 5, size: 3, duration: 18, delay: 0 },
  { left: 12, size: 2, duration: 22, delay: 3 },
  { left: 20, size: 4, duration: 16, delay: 6 },
  { left: 28, size: 2, duration: 20, delay: 1 },
  { left: 35, size: 3, duration: 24, delay: 8 },
  { left: 43, size: 2, duration: 19, delay: 4 },
  { left: 50, size: 4, duration: 21, delay: 2 },
  { left: 58, size: 3, duration: 17, delay: 7 },
  { left: 65, size: 2, duration: 23, delay: 5 },
  { left: 72, size: 3, duration: 18, delay: 9 },
  { left: 80, size: 4, duration: 20, delay: 3 },
  { left: 88, size: 2, duration: 22, delay: 6 },
  { left: 15, size: 3, duration: 25, delay: 10 },
  { left: 60, size: 2, duration: 16, delay: 11 },
  { left: 92, size: 3, duration: 19, delay: 2 },
  { left: 38, size: 2, duration: 21, delay: 12 },
];

const SPRING = { type: "spring" as const, stiffness: 220, damping: 30 };

export default function ThingsWeDo({ activities }: { activities: ActivityCard[] }) {
  const sorted = [...activities].sort((a, b) => a.order - b.order);
  const [activeIndex, setActiveIndex] = useState(0);

  const rowRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startScroll: number } | null>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  const active = sorted[activeIndex];

  // The row always shows every OTHER activity, starting right after the
  // active one and wrapping around — so clicking the first card always
  // advances to "the next one", exactly like the reference: the card that
  // becomes the new background disappears from the row, and the one that
  // was active reappears at the row's tail end.
  const others = sorted
    .map((activity, i) => ({ activity, realIndex: i }))
    .filter((entry) => entry.realIndex !== activeIndex);
  const reordered = [
    ...others.slice(activeIndex),
    ...others.slice(0, activeIndex),
  ];

  function goTo(index: number) {
    setActiveIndex((index + sorted.length) % sorted.length);
  }

  // Redirect vertical mouse-wheel scrolling into horizontal row scrolling.
  // This needs a native (non-passive) listener because React's synthetic
  // onWheel is attached as a passive listener, so preventDefault inside it
  // is silently ignored.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      row!.scrollLeft += e.deltaY;
    }

    row.addEventListener("wheel", onWheel, { passive: false });
    return () => row.removeEventListener("wheel", onWheel);
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || !rowRef.current) return;
    dragState.current = { startX: e.clientX, startScroll: rowRef.current.scrollLeft };
    rowRef.current.style.cursor = "grabbing";
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current || !rowRef.current) return;
    const dx = e.clientX - dragState.current.startX;
    rowRef.current.scrollLeft = dragState.current.startScroll - dx;
  }

  function endDrag() {
    dragState.current = null;
    if (rowRef.current) rowRef.current.style.cursor = "grab";
  }

  if (sorted.length === 0) return null;

  const showMeta = active.difficulty || active.bestSeason || active.duration;
  const ActiveIcon = ICONS[active.icon] ?? Compass;

  return (
    <section className={styles.section} id="things-we-do">
      {/* Warms the browser's (and Next's image-optimizer) cache for just the
          next couple of activities' full-size 100vw variant up front —
          without this, clicking a card for the first time meant waiting on a
          fresh fetch of a size Next had never generated before, which is
          exactly what made switching cards feel laggy. Capped to the two
          most likely next clicks (rather than every other activity) since
          eagerly fetching all of them cost every fresh visitor several extra
          MB for cards they may never open. Zero-size and inert so it never
          affects layout or interaction. */}
      <div aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        {reordered.slice(0, 2).map(({ activity }) => (
          <Image
            key={activity.id}
            src={activity.backgroundImage}
            alt=""
            width={1920}
            height={1080}
            sizes="100vw"
          />
        ))}
      </div>

      {/* The fullscreen hero image — shares a layoutId with whichever row
          card is clicked, so framer-motion morphs the clicked thumbnail
          into this exact box instead of a plain crossfade. This has to be a
          fresh mount per activity (key={active.id}) — framer-motion's
          shared-layout "jump" only triggers when a *new* element mounts
          claiming a layoutId that just vacated elsewhere; a single
          persistent node that merely relabels its layoutId prop never
          receives that treatment, which left every activity but the
          untouched initial one rendering with a broken/blank projection. */}
      <AnimatePresence>
        <motion.div
          key={active.id}
          layoutId={`visual-${active.id}`}
          className={styles.activeVisual}
          transition={SPRING}
          exit={{ opacity: 1 }}
        >
          <Image
            src={active.backgroundImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.activeImage}
          />
        </motion.div>
      </AnimatePresence>

      <div className={styles.gradientOverlay} aria-hidden="true" />
      <div className={styles.animatedWash} aria-hidden="true" />

      <div className={styles.particles} aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        className={styles.stage}
        ref={revealRef}
        style={revealStyle}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className={styles.content}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.metaTop}>
              <span className={styles.activityIcon}>
                <ActiveIcon size={16} />
              </span>
              <span className={styles.eyebrow}>THINGS WE DO</span>
            </div>

            <h2>{active.title}</h2>
            <p className={styles.description}>{active.description}</p>

            {active.highlights.length > 0 && (
              <ul className={styles.highlights}>
                {active.highlights.map((highlight) => (
                  <li key={highlight}>
                    <Check size={15} />
                    {highlight}
                  </li>
                ))}
              </ul>
            )}

            {showMeta && (
              <div className={styles.metaRow}>
                {active.difficulty && (
                  <div>
                    <Gauge size={15} />
                    <span>Difficulty</span>
                    <strong>{active.difficulty}</strong>
                  </div>
                )}

                {active.bestSeason && (
                  <div>
                    <Sun size={15} />
                    <span>Best Season</span>
                    <strong>{active.bestSeason}</strong>
                  </div>
                )}

                {active.duration && (
                  <div>
                    <Clock size={15} />
                    <span>Duration</span>
                    <strong>{active.duration}</strong>
                  </div>
                )}
              </div>
            )}

            {active.funFact && (
              <p className={styles.funFact}>
                <Sparkles size={14} />
                {active.funFact}
              </p>
            )}

            <Link href={active.buttonLink} className={styles.cta}>
              {active.buttonText}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </AnimatePresence>

        <div className={styles.rowArea}>
          <div
            className={styles.row}
            ref={rowRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            {reordered.map(({ activity, realIndex }) => {
              const Icon = ICONS[activity.icon] ?? Compass;

              return (
                <motion.button
                  key={activity.id}
                  layoutId={`visual-${activity.id}`}
                  type="button"
                  className={styles.card}
                  onClick={() => goTo(realIndex)}
                  whileHover={{ y: -8 }}
                  transition={SPRING}
                  aria-label={`Show ${activity.title}`}
                >
                  <Image
                    src={activity.backgroundImage}
                    alt={activity.title}
                    fill
                    sizes="(max-width: 700px) 40vw, 170px"
                    className={styles.cardImage}
                  />

                  <div className={styles.cardOverlay} />
                  <span className={styles.cardIcon}>
                    <Icon size={14} />
                  </span>
                  <p className={styles.cardTitle}>{activity.title}</p>
                </motion.button>
              );
            })}
          </div>

          <div className={styles.rowControls}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous activity"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className={styles.navButton}
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next activity"
            >
              <ChevronRight size={18} />
            </button>

            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${((activeIndex + 1) / sorted.length) * 100}%` }}
              />
            </div>

            <span className={styles.counter}>
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
