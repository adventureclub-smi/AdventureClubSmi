"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./StoryScenes.module.scss";

const AUTO_ADVANCE_MS = 5500;

type SceneId = "trek" | "tree" | "campfire";

const SCENES: { id: SceneId; caption: string }[] = [
  { id: "trek", caption: "Are we there yet?" },
  { id: "tree", caption: "We reached the top but still couldn't climb the tree" },
  { id: "campfire", caption: "Cold cup noodles \u{1F62D}" },
];

function SpeechBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  // The horizontal centering (translateX(-50%)) lives on this plain, static
  // wrapper rather than the animated element below — Framer Motion takes
  // full ownership of the `transform` property once anything (like `y`) is
  // animated on an element, silently dropping any CSS transform set on that
  // same element via its class.
  return (
    <div className={`${styles.bubbleAnchor} ${className ?? ""}`}>
      <motion.div
        className={styles.bubble}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function Hiker({ variant, delay }: { variant: "a" | "b"; delay: number }) {
  return (
    <div className={`${styles.hiker} ${styles[`hiker${variant}`]}`}>
      <div className={styles.backpack} />
      <div className={styles.head} />
      <div className={styles.body} />
      <motion.div
        className={styles.armBack}
        animate={{ rotate: [18, -18, 18] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay }}
      />
      <motion.div
        className={styles.armFront}
        animate={{ rotate: [-18, 18, -18] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay }}
      />
      <motion.div
        className={styles.legBack}
        animate={{ rotate: [-22, 22, -22] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay }}
      />
      <motion.div
        className={styles.legFront}
        animate={{ rotate: [22, -22, 22] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay }}
      />
    </div>
  );
}

function TrekScene() {
  return (
    <div className={styles.sceneInner}>
      <div className={styles.sky}>
        <div className={styles.cloud} style={{ left: "8%", top: "18%" }} />
        <div className={styles.cloud} style={{ left: "68%", top: "10%" }} />
      </div>

      <div className={styles.slope} />
      <div className={styles.trailDashes} />

      <motion.div
        className={styles.hikersGroup}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      >
        <Hiker variant="a" delay={0} />
        <Hiker variant="b" delay={0.15} />
      </motion.div>

      <SpeechBubble className={styles.trekBubble}>Are we there yet?</SpeechBubble>
    </div>
  );
}

function GroupPerson({ style, delay }: { style: React.CSSProperties; delay: number }) {
  return (
    <motion.div
      className={styles.groupPerson}
      style={style}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div className={styles.head} />
      <div className={styles.body} />
      <div className={styles.legStandLeft} />
      <div className={styles.legStandRight} />
    </motion.div>
  );
}

function TreeScene() {
  return (
    <div className={styles.sceneInner}>
      <div className={styles.ground} />

      <motion.div
        className={styles.tree}
        animate={{ rotate: [-1.5, 1.5, -1.5] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className={styles.trunk} />
        <div className={`${styles.foliage} ${styles.foliageA}`} />
        <div className={`${styles.foliage} ${styles.foliageB}`} />
        <div className={`${styles.foliage} ${styles.foliageC}`} />
      </motion.div>

      <motion.div
        className={styles.climber}
        animate={{ rotate: [-4, 4, -4], y: [0, -2, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className={styles.head} />
        <div className={styles.body} />
        <div className={styles.climberArm} />
        <div className={styles.climberLeg} />
      </motion.div>

      <GroupPerson style={{ left: "16%" }} delay={0} />
      <GroupPerson style={{ left: "26%" }} delay={0.3} />
      <GroupPerson style={{ left: "70%" }} delay={0.6} />
      <GroupPerson style={{ left: "80%" }} delay={0.9} />

      <SpeechBubble className={styles.treeBubble}>
        We reached the top but still couldn&apos;t climb the tree
      </SpeechBubble>
    </div>
  );
}

function SeatedPerson({ style, delay, holdingCup }: { style: React.CSSProperties; delay: number; holdingCup?: boolean }) {
  return (
    <motion.div
      className={styles.seatedPerson}
      style={style}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div className={styles.head} />
      <div className={styles.seatedBody} />
      {holdingCup && <div className={styles.noodleCup} />}
    </motion.div>
  );
}

function CampfireScene() {
  return (
    <div className={styles.sceneInner}>
      <div className={styles.groundDark} />
      <div className={styles.fireGlow} />

      <div className={styles.logs} />

      <motion.div
        className={styles.flame}
        animate={{ scaleY: [1, 1.15, 0.95, 1.1, 1], scaleX: [1, 0.92, 1.05, 0.95, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className={`${styles.flameLayer} ${styles.flameOuter}`} />
        <div className={`${styles.flameLayer} ${styles.flameInner}`} />
      </motion.div>

      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={styles.ember}
          style={{ left: `${47 + i * 2.5}%` }}
          animate={{ y: [0, -70], opacity: [0.9, 0], x: [0, i % 2 === 0 ? 8 : -8] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
        />
      ))}

      <SeatedPerson style={{ left: "14%" }} delay={0} />
      <SeatedPerson style={{ left: "28%" }} delay={0.4} holdingCup />
      <SeatedPerson style={{ left: "62%" }} delay={0.8} />
      <SeatedPerson style={{ left: "76%" }} delay={1.2} />

      <SpeechBubble className={styles.campfireBubble}>Cold cup noodles {"\u{1F62D}"}</SpeechBubble>
    </div>
  );
}

export default function StoryScenes() {
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i: number) => {
    setIndex(((i % SCENES.length) + SCENES.length) % SCENES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SCENES.length);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [index]);

  const scene = SCENES[index];

  return (
    <div className={styles.stage}>
      <button
        type="button"
        className={styles.navButton}
        onClick={() => goTo(index - 1)}
        aria-label="Previous scene"
      >
        <ChevronLeft size={20} />
      </button>

      <div className={styles.canvas}>
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            className={styles.scene}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {scene.id === "trek" && <TrekScene />}
            {scene.id === "tree" && <TreeScene />}
            {scene.id === "campfire" && <CampfireScene />}
          </motion.div>
        </AnimatePresence>

        <div className={styles.dots}>
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={i === index ? styles.dotActive : styles.dot}
              onClick={() => goTo(i)}
              aria-label={`Go to scene ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className={styles.navButton}
        onClick={() => goTo(index + 1)}
        aria-label="Next scene"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
