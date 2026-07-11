"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import BackgroundParticles from "./BackgroundParticles";
import FloatingGlow from "./FloatingGlow";
import Dog, { type DogPose } from "./Dog";
import Lantern from "./Lantern";
import Clothesline from "./Clothesline";
import MemoryCard from "./MemoryCard";
import StoryModal from "./StoryModal";
import { memories, type Memory } from "./MemoryData";
import styles from "./TrailTalesExperience.module.scss";

type Phase =
  | "idle"
  | "alert"
  | "running"
  | "jumping"
  | "lit"
  | "clothesline"
  | "cards"
  | "settling"
  | "settled";

const DOG_START_X = 50;
const LANTERN_X = 78;
const DOG_AT_LANTERN_X = LANTERN_X - 9;
const DOG_SETTLE_X = 46;

export default function TrailTalesExperience() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [dogX, setDogX] = useState(DOG_START_X);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [barking, setBarking] = useState(false);
  const [cursorLook, setCursorLook] = useState<number | null>(null);
  const [forcedLook, setForcedLook] = useState<number | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
    };
  }, []);

  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // Bonus: bark once if left idle (un-clicked) for 20 seconds.
  useEffect(() => {
    if (phase !== "idle") return;
    const timeout = setTimeout(() => {
      setBarking(true);
      setTimeout(() => setBarking(false), 700);
    }, 20000);
    return () => clearTimeout(timeout);
  }, [phase]);

  // Bonus: dog's head gently tracks the cursor while it's idle-eligible.
  const cursorEligible = phase === "idle" || phase === "settled";
  const handleStageMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cursorEligible || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const dogPixelX = rect.left + rect.width * (dogX / 100);
      const offset = ((e.clientX - dogPixelX) / rect.width) * 100;
      setCursorLook(Math.max(-10, Math.min(10, offset)));
    },
    [cursorEligible, dogX]
  );

  const startSequence = useCallback(() => {
    if (phase !== "idle") return;

    setPhase("alert");
    after(700, () => {
      setDogX(DOG_AT_LANTERN_X);
      setPhase("running");
    });
    after(700 + 900, () => setPhase("jumping"));
    after(700 + 900 + 550, () => setPhase("lit"));
    after(700 + 900 + 550 + 1600, () => setPhase("clothesline"));
    after(700 + 900 + 550 + 1600 + 1100, () => setPhase("cards"));
    after(700 + 900 + 550 + 1600 + 1100 + 1800, () => {
      setDogX(DOG_SETTLE_X);
      setPhase("settling");
    });
    after(700 + 900 + 550 + 1600 + 1100 + 1800 + 900, () => setPhase("settled"));
  }, [phase]);

  // Bonus: clicking the settled dog again is just a playful spin, not a replay.
  const handleSettledClick = useCallback(() => {
    setSpinToken((t) => t + 1);
  }, []);

  // Bonus: after closing a story, the dog glances toward another card, as if
  // suggesting "read this one next."
  const closeModal = useCallback(() => {
    setSelectedMemory(null);
    if (phase !== "settled" || memories.length < 2) return;
    const nextIndex = Math.floor(Math.random() * memories.length);
    const spanStart = 8;
    const spanEnd = 92;
    const cardPct = spanStart + ((nextIndex + 0.5) / memories.length) * (spanEnd - spanStart);
    const offset = Math.max(-10, Math.min(10, cardPct - DOG_SETTLE_X));
    setForcedLook(offset);
    after(1400, () => setForcedLook(null));
  }, [phase]);

  const dogPose: DogPose =
    phase === "idle"
      ? barking
        ? "alert"
        : "sitting"
      : phase === "alert"
      ? "alert"
      : phase === "running" || phase === "settling"
      ? "running"
      : phase === "jumping"
      ? "jumping"
      : phase === "settled"
      ? "settled"
      : "sitting";

  const lanternLit = phase !== "idle" && phase !== "alert" && phase !== "running" && phase !== "jumping";
  const lanternJolted = phase === "jumping";
  const glowAwake = lanternLit;
  const clotheslineGrown = phase === "clothesline" || phase === "cards" || phase === "settling" || phase === "settled";
  const cardsVisible = phase === "cards" || phase === "settling" || phase === "settled";
  const lookAt = cursorEligible ? forcedLook ?? cursorLook ?? undefined : undefined;

  return (
    <div
      className={styles.stage}
      ref={stageRef}
      onMouseMove={handleStageMouseMove}
      onMouseLeave={() => setCursorLook(null)}
    >
      <BackgroundParticles />
      <FloatingGlow awake={glowAwake} originXPct={LANTERN_X} />

      <div className={styles.clotheslineArea}>
        <Clothesline grown={clotheslineGrown} />
      </div>

      <div className={styles.cardsRow}>
        {memories.map((memory, i) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            index={i}
            visible={cardsVisible}
            onOpen={() => setSelectedMemory(memory)}
          />
        ))}
      </div>

      {phase === "idle" && (
        <p className={styles.prompt}>Click me to relive our adventures</p>
      )}

      <div className={styles.lanternWrap} style={{ left: `${LANTERN_X}%` }}>
        <Lantern lit={lanternLit} jolted={lanternJolted} />
      </div>

      <motion.div
        className={styles.dogWrap}
        animate={{ left: `${dogX}%` }}
        transition={{
          duration: phase === "running" || phase === "settling" ? 0.9 : 0.4,
          ease: "easeInOut",
        }}
      >
        <Dog
          pose={dogPose}
          onClick={phase === "idle" ? startSequence : phase === "settled" ? handleSettledClick : undefined}
          clickable={phase === "idle" || phase === "settled"}
          lookAt={lookAt}
          spinToken={spinToken}
        />
      </motion.div>

      <StoryModal memory={selectedMemory} onClose={closeModal} />
    </div>
  );
}
