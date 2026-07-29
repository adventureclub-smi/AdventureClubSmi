"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import HeroOverlay from "./HeroOverlay";
import { useCountdown } from "@/hooks/useCountdown";
import { useRegistrationPhase } from "@/hooks/useRegistrationPhase";
import { useLazyVideo } from "@/hooks/useLazyVideo";
import type { HeroContent } from "@/types/homepage";
import styles from "./Hero.module.scss";

function HeroCountdown({
  target,
  trekId,
  registrationOpensAt,
}: {
  target: string;
  trekId: string | null;
  registrationOpensAt: string | null;
}) {
  const { phase, target: countdownTarget, label } = useRegistrationPhase(
    target,
    registrationOpensAt
  );
  const countdown = useCountdown(countdownTarget);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.5 }}
      className={styles.countdown}
    >
      <div className={styles.countdownRow}>
        <span className={styles.countdownLabel}>{label}</span>

        <div className={styles.countdownUnits}>
          {[
            { label: "D", value: countdown.days },
            { label: "H", value: countdown.hours },
            { label: "M", value: countdown.minutes },
            { label: "S", value: countdown.seconds },
          ].map((unit) => (
            <span key={unit.label}>
              {String(unit.value).padStart(2, "0")}
              <em>{unit.label}</em>
            </span>
          ))}
        </div>
      </div>

      {trekId && phase === "trekDay" && (
        <Link href={`/treks/${trekId}`} className={styles.countdownRegister}>
          Register Now
        </Link>
      )}

      {trekId && phase === "opensIn" && (
        // Nudges students to log in / land on their dashboard while they
        // wait, so they're already signed in the instant registration opens
        // instead of hitting a login wall right as the countdown ends.
        <Link href="/dashboard" className={styles.countdownRegister}>
          Open
        </Link>
      )}
    </motion.div>
  );
}

export default function Hero({
  content,
  nextTrekDate,
  nextTrekId = null,
  nextTrekRegistrationOpensAt = null,
}: {
  content: HeroContent;
  nextTrekDate: string | null;
  nextTrekId?: string | null;
  nextTrekRegistrationOpensAt?: string | null;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useLazyVideo(videoRef);
  const reducedMotion = useReducedMotion();

  // Hero content gently recedes as the user starts scrolling into the next
  // section, rather than cutting abruptly.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.8], [0, -60]);
  // The background footage slowly pushes in as you scroll away, reinforcing
  // the sense that the whole scene is sinking back rather than just fading.
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  return (
    <section className={styles.hero} id="home" ref={sectionRef}>
      {/* useLazyVideo's own doc comment pairs it with preload="none", but
          the hero is always in view the instant the page loads — deferring
          the fetch until the play() call just adds a buffering stutter
          right at first paint with no bandwidth benefit, since "lazy" here
          never actually meant "later." play()/pause() on scroll still runs
          via the hook; only the eager-download behavior is opted back in. */}
      <motion.video
        ref={videoRef}
        className={styles.video}
        muted
        loop
        playsInline
        preload="auto"
        style={reducedMotion ? undefined : { scale: videoScale }}
      >
        <source src={content.videoUrl} type="video/mp4" />
      </motion.video>

      <HeroOverlay />

      <motion.div
        className={styles.content}
        style={
          reducedMotion
            ? undefined
            : { opacity: contentOpacity, y: contentY }
        }
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className={styles.tag}
        >
          {content.tagline}
        </motion.p>

        <h1 className={styles.title}>
          {content.titleWords.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 80, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.9,
                delay: 0.35 + i * 0.18,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={styles.word}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05 }}
          className={styles.lead}
        >
          {content.leadLine}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className={styles.subtitle}
        >
          {content.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.35 }}
          className={styles.actions}
        >
          {content.buttons.map((button) => (
            <Link
              key={button.label}
              href={button.href}
              className={
                button.style === "primary"
                  ? styles.primaryButton
                  : styles.secondaryButton
              }
            >
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className={styles.buttonInner}
              >
                {button.label}
              </motion.span>
            </Link>
          ))}
        </motion.div>

        {content.showCountdown && nextTrekDate && (
          <HeroCountdown
            target={nextTrekDate}
            trekId={nextTrekId}
            registrationOpensAt={nextTrekRegistrationOpensAt}
          />
        )}
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className={styles.scroll}
      >
        <ChevronDown size={30} strokeWidth={1.5} />
      </motion.div>
    </section>
  );
}
