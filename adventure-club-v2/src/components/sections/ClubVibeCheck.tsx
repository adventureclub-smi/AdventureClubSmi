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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentIndex === null || !audioRef.current) return;

    audioRef.current.src = songs[currentIndex].audioUrl;
    ensureAudioGraph();
    // Switching songs quickly (rapid next/cover clicks) can set a new src
    // before the previous play() promise settles, which rejects it with an
    // AbortError — expected and harmless, so it's swallowed rather than
    // surfacing as an unhandled rejection.
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  }, [currentIndex, songs]);

  // Drives the background visualizer bars from the live audio frequency data.
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      resetBars();
      return;
    }

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    // Real frequency data is bass-heavy at low bin indices and trails off
    // to near-silence at high indices — mapping bars 0..N straight across
    // the width made the left side (bass) dance and the right side (treble)
    // sit nearly flat. Mirror outward from the center instead so both sides
    // pull from the same energetic low/mid bins and react symmetrically.
    const center = (BAR_COUNT - 1) / 2;
    const maxDist = Math.ceil(BAR_COUNT / 2);
    const chunk = Math.max(1, Math.floor(analyser.frequencyBinCount / maxDist));

    function tick() {
      analyser.getByteFrequencyData(data);

      for (let i = 0; i < BAR_COUNT; i++) {
        const dist = Math.round(Math.abs(i - center));

        let sum = 0;
        for (let j = 0; j < chunk; j++) sum += data[dist * chunk + j] || 0;
        const scale = Math.max(0.08, sum / chunk / 255);

        const bar = barRefs.current[i];
        if (bar) bar.style.transform = `scaleY(${scale})`;
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying]);

  function resetBars() {
    barRefs.current.forEach((bar) => {
      if (bar) bar.style.transform = "scaleY(0.08)";
    });
  }

  function ensureAudioGraph() {
    if (audioCtxRef.current || !audioRef.current) return;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch (err) {
      console.error("Audio visualizer unavailable:", err);
    }
  }

  function playSong(index: number) {
    if (index === currentIndex) {
      togglePlay();
      return;
    }

    setCurrentIndex(index);
  }

  function togglePlay() {
    if (!audioRef.current) return;

    audioCtxRef.current?.resume();

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
    setCurrentIndex((from + 1) % songs.length);
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
          <h2>Club Vibe Check</h2>
          <p className={styles.tagline}>
            More than songs—this is the spirit of Adventure Club. lets{" "}
            <span className={styles.accentPhrase}>REST IN PEAK</span>
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

      <audio ref={audioRef} crossOrigin="anonymous" onEnded={nextSong} />
    </section>
  );
}
