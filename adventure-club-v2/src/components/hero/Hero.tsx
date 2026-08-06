"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import HeroOverlay from "./HeroOverlay";
import { useCountdown } from "@/hooks/useCountdown";
import { useRegistrationPhase } from "@/hooks/useRegistrationPhase";
import { useLazyVideo } from "@/hooks/useLazyVideo";
import type { HeroContent } from "@/types/homepage";
import styles from "./Hero.module.scss";

// Three.js touches the GPU/canvas — never render it on the server, and
// only pull the (fairly heavy) three.js bundle in once the browser
// actually needs it, so it can't block first paint.
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
});

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
  const [isMobile, setIsMobile] = useState(false);
  const [pointerFine, setPointerFine] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 700);
    updateMobile();
    window.addEventListener("resize", updateMobile);

    function checkPointer() {
      setPointerFine(window.matchMedia("(pointer: fine)").matches);
    }
    checkPointer();

    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  // "Join Adventure" only makes sense for a visitor who isn't a member yet —
  // same session check the navbar uses (the token cookie is httpOnly, so
  // client JS can't just read it directly).
  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (active) setLoggedIn(!!data.loggedIn);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Hero content gently recedes as the user starts scrolling into the next
  // section, rather than cutting abruptly — the 3D scene reads the same
  // progress (via a ref, not React state, since it updates every frame) to
  // sink slightly further away at the same time.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.8], [0, -60]);
  // The background footage slowly pushes in as you scroll away, reinforcing
  // the sense that the whole scene is sinking back rather than just fading.
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollProgressRef.current = v;
  });

  // Pauses the wireframe's render loop once you've scrolled well past the
  // hero, instead of letting it run for the rest of the page's lifetime.
  const sceneInView = useInView(sectionRef, { margin: "300px" });

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
        poster="/videos/hero-poster.jpg"
        style={reducedMotion ? undefined : { scale: videoScale }}
      >
        <source src={content.videoUrl} type="video/mp4" />
      </motion.video>

      <div className={styles.scene}>
        <HeroScene
          interactive={pointerFine && !reducedMotion}
          animate={!reducedMotion && sceneInView}
          scrollProgress={scrollProgressRef}
          isMobile={isMobile}
        />
      </div>

      <HeroOverlay />

      <motion.div
        className={styles.content}
        style={
          reducedMotion
            ? undefined
            : { opacity: contentOpacity, y: contentY }
        }
      >
        {content.announcement && (
          <motion.p
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className={styles.announcement}
          >
            {content.announcement}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className={styles.heroLogo}
        >
          <Image src="/logo/logo-bluegreen.png" alt="NAVIRA" width={265} height={150} priority />
        </motion.div>

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
          {content.buttons
            .filter((button) => !(loggedIn && button.href === "/signup"))
            .map((button) => (
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

        {/* Used to be absolutely positioned a fixed 40px from the bottom
            of the whole hero section, independent of how tall the content
            above it actually rendered — on shorter screens (or with the
            content block's zoom scaling), the buttons could end up tall
            enough to collide with it, showing the chevron poking through
            the bottom of "Explore Treks". Flowing it here as the last
            piece of content guarantees it always sits below everything
            else, however tall that turns out to be. */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className={styles.scroll}
        >
          <ChevronDown size={30} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </section>
  );
}
