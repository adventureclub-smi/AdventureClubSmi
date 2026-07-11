"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import styles from "./Dog.module.scss";

export type DogPose = "sitting" | "alert" | "running" | "jumping" | "settled";

function useRandomLoop(callback: () => void, minMs: number, maxMs: number, enabled: boolean) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    function schedule() {
      const delay = minMs + Math.random() * (maxMs - minMs);
      timeoutId = setTimeout(() => {
        savedCallback.current();
        schedule();
      }, delay);
    }

    schedule();
    return () => clearTimeout(timeoutId);
  }, [minMs, maxMs, enabled]);
}

export default function Dog({
  pose,
  onClick,
  clickable,
  lookAt,
  spinToken,
}: {
  pose: DogPose;
  onClick?: () => void;
  clickable?: boolean;
  /** Overrides the idle random look-around with a fixed offset (e.g. cursor tracking), roughly -10..10. */
  lookAt?: number;
  /** Bump this number to trigger one playful full-turn spin. */
  spinToken?: number;
}) {
  const [blinking, setBlinking] = useState(false);
  const [lookOffset, setLookOffset] = useState(0);
  const [earTwitch, setEarTwitch] = useState(false);
  const [spins, setSpins] = useState(0);
  const lastSpinToken = useRef(spinToken);

  const idleActive = pose === "sitting" || pose === "settled";
  const effectiveLook = typeof lookAt === "number" ? lookAt : lookOffset;

  useEffect(() => {
    if (spinToken === undefined || spinToken === lastSpinToken.current) return;
    lastSpinToken.current = spinToken;
    setSpins((s) => s + 1);
  }, [spinToken]);

  useRandomLoop(
    () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 140);
    },
    2200,
    5000,
    idleActive
  );

  useRandomLoop(
    () => {
      setLookOffset((prev) => (prev === 0 ? (Math.random() > 0.5 ? 10 : -10) : 0));
    },
    3500,
    7000,
    idleActive
  );

  useRandomLoop(
    () => {
      setEarTwitch(true);
      setTimeout(() => setEarTwitch(false), 260);
    },
    2800,
    6000,
    idleActive
  );

  const tailWagSpeed = pose === "alert" ? 0.22 : pose === "running" ? 0.16 : 0.9;
  const isRunning = pose === "running";
  const isJumping = pose === "jumping";
  const isAlert = pose === "alert";

  return (
    <motion.div
      animate={{ rotate: spins * 360 }}
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
    >
    <motion.div
      className={`${styles.dog} ${clickable ? styles.clickable : ""}`}
      onClick={clickable ? onClick : undefined}
      animate={
        isRunning
          ? { y: [0, -10, 0, -10, 0], rotate: [0, -2, 0, -2, 0] }
          : isJumping
          ? { y: [0, -34, 0], scale: [1, 1.06, 1] }
          : { y: 0, rotate: 0, scale: 1 }
      }
      transition={
        isRunning
          ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
          : isJumping
          ? { duration: 0.55, ease: "easeOut" }
          : { duration: 0.4 }
      }
    >
      <motion.svg
        viewBox="0 0 200 160"
        width="100%"
        height="100%"
        animate={{ scaleY: idleActive ? [1, 1.015, 1] : 1 }}
        transition={{ duration: 2.6, repeat: idleActive ? Infinity : 0, ease: "easeInOut" }}
      >
        {/* tail */}
        <motion.path
          d="M 48 92 Q 20 70 26 40"
          stroke="var(--color-text)"
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          style={{ transformOrigin: "48px 92px" }}
          animate={{ rotate: [-8, 14, -8] }}
          transition={{ duration: tailWagSpeed, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* body */}
        <ellipse cx={95} cy={108} rx={48} ry={36} fill="var(--color-text)" />

        {/* front legs */}
        <rect x={70} y={128} width={11} height={26} rx={5} fill="var(--color-text)" />
        <rect x={104} y={128} width={11} height={26} rx={5} fill="var(--color-text)" />

        {/* head group */}
        <motion.g
          style={{ transformOrigin: "148px 68px" }}
          animate={{
            rotate: isAlert ? 0 : effectiveLook,
            x: isAlert ? 4 : 0,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* back ear */}
          <motion.path
            d="M 132 46 Q 122 24 138 30 Q 140 42 132 46 Z"
            fill="var(--color-text)"
            style={{ transformOrigin: "132px 40px" }}
            animate={{ rotate: earTwitch ? -18 : 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* snout */}
          <ellipse cx={172} cy={76} rx={16} ry={11} fill="var(--color-text)" />
          <circle cx={186} cy={74} r={3.4} fill="#050505" />

          {/* head */}
          <circle cx={148} cy={68} r={30} fill="var(--color-text)" />

          {/* front ear */}
          <motion.path
            d="M 160 42 Q 168 18 178 34 Q 172 48 160 42 Z"
            fill="var(--color-text)"
            style={{ transformOrigin: "168px 36px" }}
            animate={{ rotate: earTwitch ? 12 : 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* eye */}
          <circle cx={158} cy={62} r={3.2} fill="#e8ffe4" />
          <motion.rect
            x={154}
            y={57}
            width={9}
            height={10}
            fill="var(--color-text)"
            animate={{ scaleY: blinking ? 1 : 0 }}
            style={{ transformOrigin: "158px 62px" }}
            transition={{ duration: 0.08 }}
          />

          {/* mouth / bark */}
          <motion.ellipse
            cx={176}
            cy={86}
            rx={4}
            ry={2}
            fill="#050505"
            animate={{ ry: isAlert ? [2, 7, 2] : 2 }}
            transition={{ duration: 0.35, repeat: isAlert ? 2 : 0 }}
          />
        </motion.g>
      </motion.svg>

      {isAlert && (
        <motion.div
          className={styles.barkMark}
          initial={{ opacity: 0, y: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], y: -18, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          !
        </motion.div>
      )}

      {isRunning && (
        <div className={styles.trail} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={styles.dust}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.8, x: -30 - i * 14 }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}
    </motion.div>
    </motion.div>
  );
}
