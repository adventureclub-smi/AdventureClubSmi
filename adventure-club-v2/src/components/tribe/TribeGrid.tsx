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

export default function TribeGrid({
  members,
  background,
}: {
  members: TribeMemberSummary[];
  background?: Background;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const selectedMember = members.find((member) => member.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedMember?.songUrl || !audioRef.current) return;

    audioRef.current.src = selectedMember.songUrl;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, [selectedMember]);

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
                    <div className={styles.songRow}>
                      <Music size={14} />
                      Their Anthem · {selectedMember.songTitle}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <audio ref={audioRef} crossOrigin="anonymous" />
    </section>
  );
}
