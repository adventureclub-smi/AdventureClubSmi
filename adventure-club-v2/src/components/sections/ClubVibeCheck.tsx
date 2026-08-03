"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward } from "lucide-react";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { SongSummary } from "@/data/songs";
import styles from "./ClubVibeCheck.module.scss";

const BAR_COUNT = 90;

export default function ClubVibeCheck({ songs }: { songs: SongSummary[] }) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);
  const frameRef = useRef<number | null>(null);

  function resetBars() {
    barRefs.current.forEach((bar) => {
      if (bar) bar.style.transform = "scaleY(0.08)";
    });
  }

  // Bars used to be driven by a Web Audio AnalyserNode reading real
  // frequency data — but that requires routing the <audio> element's
  // output through an AudioContext via createMediaElementSource, and
  // that routing turned out to be unreliable: playback would report
  // "playing" (currentTime advancing, no errors) while producing no
  // audible sound at all, across desktop and mobile alike. Simulating a
  // lively pulse with layered sine waves keeps the visual without
  // touching the audio element's actual output path at all.
  useEffect(() => {
    if (!isPlaying) {
      resetBars();
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const t = (now - start) / 1000;

      for (let i = 0; i < BAR_COUNT; i++) {
        const wave =
          Math.sin(t * 2.4 + i * 0.35) * 0.5 +
          Math.sin(t * 4.1 + i * 0.12) * 0.3 +
          Math.sin(t * 1.1 + i * 0.6) * 0.2;
        const scale = Math.max(0.08, 0.5 + wave * 0.45);

        const bar = barRefs.current[i];
        if (bar) bar.style.transform = `scaleY(${scale})`;
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying]);

  function loadAndPlay(index: number) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = songs[index].audioUrl;
    // Switching songs quickly (rapid next/cover clicks) can set a new src
    // before the previous play() promise settles, which rejects it with an
    // AbortError — expected and harmless, so it's swallowed rather than
    // surfacing as an unhandled rejection.
    audio.play().catch(() => {});

    setCurrentIndex(index);
    setIsPlaying(true);
  }

  function playSong(index: number) {
    if (index === currentIndex) {
      togglePlay();
      return;
    }

    loadAndPlay(index);
  }

  function togglePlay() {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function nextSong() {
    const from = currentIndex ?? Math.floor((songs.length - 1) / 2);
    loadAndPlay((from + 1) % songs.length);
  }

  if (songs.length === 0) return null;

  const activeIndex = currentIndex ?? Math.floor((songs.length - 1) / 2);

  return (
    <section className={styles.section} id="vibe-check">
      <div className={styles.bgArt} aria-hidden="true">
        <AnimatePresence>
          <motion.div
            key={songs[activeIndex]?.id}
            className={styles.bgArtImageWrap}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src={songs[activeIndex].thumbnailUrl}
              alt=""
              fill
              sizes="100vw"
              className={styles.bgArtImage}
            />
          </motion.div>
        </AnimatePresence>

        <div className={styles.bgArtScrim} />
      </div>

      <motion.div
        className={styles.container}
        ref={revealRef}
        style={revealStyle}
      >
        <motion.div
          className={styles.heading}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={styles.eyebrow}>THE SOUNDTRACK</span>
          <h2>Club Vibe</h2>
          <p className={styles.tagline}>
            They&apos;re not just songs, they&apos;re more than that
          </p>
        </motion.div>

        <div className={styles.stage}>
          <div className={styles.visualizer} aria-hidden="true">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <span
                key={i}
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
                className={styles.bar}
              />
            ))}
          </div>

          <div className={styles.coverflow}>
            {songs.map((song, i) => {
              const offset = i - activeIndex;
              const abs = Math.abs(offset);
              const isActive = offset === 0;

              return (
                <motion.button
                  key={song.id}
                  type="button"
                  className={`${styles.slide} ${isActive ? styles.slideActive : ""}`}
                  style={{ zIndex: 100 - abs }}
                  animate={{
                    x: `${offset * 62}%`,
                    rotateY: Math.max(-55, Math.min(55, -offset * 38)),
                    scale: Math.max(0.55, 1 - abs * 0.12),
                    opacity: Math.max(0.35, 1 - abs * 0.18),
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 32 }}
                  onClick={() => playSong(i)}
                  aria-label={isActive && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
                >
                  <Image
                    src={song.thumbnailUrl}
                    alt={song.title}
                    fill
                    sizes="(max-width: 700px) 55vw, 220px"
                    className={styles.slideImage}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>

        <motion.div
          key={songs[activeIndex]?.id}
          className={styles.nowPlaying}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className={styles.nowPlayingTitle}>{songs[activeIndex]?.title}</p>

          <div className={styles.nowPlayingControls}>
            <button className={styles.controlButton} onClick={togglePlay} aria-label="Play/Pause">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button className={styles.controlButton} onClick={nextSong} aria-label="Next song">
              <SkipForward size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* No crossOrigin here: the R2 CDN these songs are hosted on doesn't
          send Access-Control-Allow-Origin, and "crossOrigin" forces the
          browser to fetch in CORS mode — which fails the load outright
          (no playback at all) instead of just losing the visualizer.
          Without it, playback works normally; the analyser below just
          can't read frequency data from a cross-origin, non-CORS source,
          so the bars stay flat rather than erroring. */}
      <audio ref={audioRef} onEnded={nextSong} />
    </section>
  );
}
