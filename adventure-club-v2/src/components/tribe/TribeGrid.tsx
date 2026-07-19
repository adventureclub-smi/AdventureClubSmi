"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Music, ArrowLeft } from "lucide-react";

import type { TribeMemberSummary } from "@/data/tribe";
import styles from "./TribeGrid.module.scss";

function TribeCard({
  member,
  size,
  active,
  selected,
  onClick,
  delay,
}: {
  member: TribeMemberSummary;
  size: "lg" | "sm";
  active: boolean;
  selected: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.div
      layout
      className={`${styles.card} ${styles[size]} ${active ? styles.split : ""} ${
        selected ? styles.selected : ""
      }`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ layout: { type: "spring", stiffness: 260, damping: 26 }, delay }}
    >
      <button
        type="button"
        className={styles.cardInner}
        onClick={onClick}
        aria-label={`View ${member.name}`}
      >
        <div className={styles.photoWrap}>
          <Image
            src={member.photoUrl}
            alt={member.name}
            fill
            sizes="(max-width: 700px) 40vw, 260px"
            className={styles.photo}
          />

          {member.songUrl && (
            <span className={styles.songIndicator}>
              <Music size={12} />
            </span>
          )}
        </div>

        <div className={styles.info}>
          <span className={styles.role}>{member.role}</span>
          <h3>{member.name}</h3>
          <p>
            {member.year} · {member.course}
          </p>
        </div>
      </button>
    </motion.div>
  );
}

type Background = {
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
};

const BAR_COUNT = 40;

export default function TribeGrid({
  members,
  background,
}: {
  members: TribeMemberSummary[];
  background?: Background;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const frameRef = useRef<number | null>(null);

  const selectedMember = members.find((member) => member.id === selectedId) ?? null;

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

  useEffect(() => {
    if (!selectedMember?.songUrl || !audioRef.current) return;

    audioRef.current.src = selectedMember.songUrl;
    audioRef.current.currentTime = 0;
    ensureAudioGraph();
    // Switching between members' anthems quickly can set a new src before
    // the previous play() promise settles, which rejects it with an
    // AbortError — expected and harmless, so it's swallowed rather than
    // surfacing as an unhandled rejection (same pattern as Club Vibe Check).
    audioRef.current.play().catch(() => {});
  }, [selectedMember]);

  // Drives the frequency-reactive bars from the live audio, same technique
  // as the homepage's Club Vibe Check section.
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      resetBars();
      return;
    }

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

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

  // Stop playback if the visitor navigates away from the page entirely,
  // not just when they close the detail panel.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  function select(id: string) {
    setSelectedId(id);
  }

  function closeDetail() {
    setSelectedId(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  const leadership = members.filter((member) => member.tier === 1);
  const heads = members.filter((member) => member.tier === 2);
  const team = members.filter((member) => member.tier !== 1 && member.tier !== 2);

  return (
    <section className={styles.section}>
      {background?.mediaUrl && (
        <div className={styles.bg}>
          {background.mediaType === "VIDEO" ? (
            <video
              src={background.mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className={styles.bgMedia}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={background.mediaUrl} alt="" className={styles.bgMedia} />
          )}
          <div className={styles.bgScrim} />
        </div>
      )}

      <AnimatePresence>
        {selectedMember && (
          <motion.div
            key={selectedMember.id}
            className={styles.detailBgArt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            aria-hidden="true"
          >
            <Image
              src={selectedMember.photoUrl}
              alt=""
              fill
              sizes="100vw"
              className={styles.detailBgArtImage}
            />
            <div className={styles.detailBgArtScrim} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${styles.container} ${selectedMember ? styles.split : ""}`}>
        {!selectedMember && (
          <motion.div
            className={styles.heading}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className={styles.eyebrow}>MEET THE TRIBE</span>
            <h1>The Crew Behind Every Climb.</h1>
            <p className={styles.tagline}>
              Every expedition needs a base camp. These are the people who run
              ours — click on a face to see more.
            </p>
          </motion.div>
        )}

        {members.length === 0 ? (
          <div className={styles.empty}>
            <Compass size={30} />
            <h3>Roster Coming Soon</h3>
            <p>This year&apos;s tribe is being assembled. Check back soon.</p>
          </div>
        ) : (
          <motion.div layout className={styles.cardsArea}>
            {leadership.length > 0 && (
              <motion.div layout className={styles.leadershipRow}>
                {leadership.map((member, i) => (
                  <TribeCard
                    key={member.id}
                    member={member}
                    size="lg"
                    active={!!selectedMember}
                    selected={selectedId === member.id}
                    onClick={() => select(member.id)}
                    delay={i * 0.08}
                  />
                ))}
              </motion.div>
            )}

            {heads.length > 0 && (
              <motion.div layout className={styles.headsRow}>
                {heads.map((member, i) => (
                  <TribeCard
                    key={member.id}
                    member={member}
                    size="sm"
                    active={!!selectedMember}
                    selected={selectedId === member.id}
                    onClick={() => select(member.id)}
                    delay={(i % 8) * 0.06}
                  />
                ))}
              </motion.div>
            )}

            {team.length > 0 && (
              <motion.div layout className={styles.teamGrid}>
                {team.map((member, i) => (
                  <TribeCard
                    key={member.id}
                    member={member}
                    size="sm"
                    active={!!selectedMember}
                    selected={selectedId === member.id}
                    onClick={() => select(member.id)}
                    delay={(i % 8) * 0.06}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {selectedMember && (
            <motion.div
              className={styles.detailPanel}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <button type="button" className={styles.backButton} onClick={closeDetail}>
                <ArrowLeft size={16} /> Back
              </button>

              <div className={styles.detailPhotoWrap}>
                <Image
                  src={selectedMember.photoUrl}
                  alt={selectedMember.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 640px"
                  className={styles.detailPhoto}
                  priority
                />

                <div className={styles.detailScrim} />

                <div className={styles.detailOverlay}>
                  <span className={styles.role}>{selectedMember.role}</span>
                  <h2>{selectedMember.name}</h2>
                  <p className={styles.detailMeta}>
                    {selectedMember.year} · {selectedMember.course}
                  </p>
                  <p className={styles.detailBio}>{selectedMember.bio}</p>

                  {selectedMember.songUrl && (
                    <>
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

                      <div className={styles.songRow}>
                        <Music size={14} />
                        Their Anthem · {selectedMember.songTitle}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </section>
  );
}
