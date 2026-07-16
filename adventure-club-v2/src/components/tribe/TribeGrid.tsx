"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Compass, Music } from "lucide-react";

import type { TribeMemberSummary } from "@/data/tribe";
import styles from "./TribeGrid.module.scss";

function TribeCard({
  member,
  size,
  flipped,
  playing,
  onClick,
  delay,
}: {
  member: TribeMemberSummary;
  size: "lg" | "sm";
  flipped: boolean;
  playing: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.div
      layout
      className={`${styles.card} ${styles[size]} ${flipped ? styles.active : ""}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ layout: { type: "spring", stiffness: 260, damping: 26 }, delay }}
    >
      <button
        type="button"
        className={`${styles.cardInner} ${flipped ? styles.flipped : ""}`}
        onClick={onClick}
        aria-label={flipped ? `Close ${member.name}` : `Open ${member.name}`}
      >
        <div className={`${styles.face} ${styles.front}`}>
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
        </div>

        <div className={`${styles.face} ${styles.back}`}>
          <span className={styles.role}>{member.role}</span>
          <h3>{member.name}</h3>
          <p className={styles.backMeta}>
            {member.year} · {member.course}
          </p>
          <p className={styles.bio}>{member.bio}</p>

          {member.songUrl && (
            <div className={`${styles.songRow} ${playing ? styles.songRowActive : ""}`}>
              <Music size={13} />
              {playing ? "Now Playing" : "Their Anthem"} · {member.songTitle}
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}

export default function TribeGrid({ members }: { members: TribeMemberSummary[] }) {
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const flippedMember = members.find((member) => member.id === flippedId) ?? null;

  useEffect(() => {
    if (!flippedMember?.songUrl || !audioRef.current) return;

    audioRef.current.src = flippedMember.songUrl;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, [flippedMember]);

  // Stop playback if the visitor navigates away from the page entirely,
  // not just when they flip a card back.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  function toggleFlip(id: string) {
    setFlippedId((prev) => {
      if (prev === id) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        return null;
      }

      return id;
    });
  }

  const leadership = members.filter((member) => member.tier === 1);
  const team = members.filter((member) => member.tier !== 1);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
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
            ours — click on a face to flip it open.
          </p>
        </motion.div>

        {members.length === 0 ? (
          <div className={styles.empty}>
            <Compass size={30} />
            <h3>Roster Coming Soon</h3>
            <p>This year&apos;s tribe is being assembled. Check back soon.</p>
          </div>
        ) : (
          <>
            {leadership.length > 0 && (
              <div className={styles.leadershipRow}>
                {leadership.map((member, i) => (
                  <TribeCard
                    key={member.id}
                    member={member}
                    size="lg"
                    flipped={flippedId === member.id}
                    playing={flippedId === member.id && !!member.songUrl}
                    onClick={() => toggleFlip(member.id)}
                    delay={i * 0.08}
                  />
                ))}
              </div>
            )}

            {team.length > 0 && (
              <div className={styles.teamGrid}>
                {team.map((member, i) => (
                  <TribeCard
                    key={member.id}
                    member={member}
                    size="sm"
                    flipped={flippedId === member.id}
                    playing={flippedId === member.id && !!member.songUrl}
                    onClick={() => toggleFlip(member.id)}
                    delay={(i % 8) * 0.06}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <audio ref={audioRef} crossOrigin="anonymous" />
    </section>
  );
}
