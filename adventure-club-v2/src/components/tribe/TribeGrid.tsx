"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Music, ArrowLeft, X } from "lucide-react";

import type { TribeMemberSummary } from "@/data/tribe";
import styles from "./TribeGrid.module.scss";

// The course field is free text like "B.Des - Industrial Arts and Design
// Practices" or "B.Des ( Creative and applied Computation )" — the full
// specialization overflows the small card, so just the degree (everything
// before the first "-" or "(") is shown there. The detail panel still shows
// the full text since it has room for it.
function degreeOnly(course: string) {
  return course.split(/[-(]/)[0].trim();
}

// Faculty/non-student members don't have a real year or course — admin can
// leave either blank or pick "Not Specified" rather than being forced to
// invent one, and this is what keeps that from printing a stray "Not
// Specified" or a dangling " · " separator on the public page.
function isUnset(value: string) {
  return !value.trim() || value.trim().toLowerCase() === "not specified";
}

function yearCourseLine(year: string, course: string) {
  return [year, course].filter((part) => !isUnset(part)).join(" · ");
}

function TribeCard({
  member,
  size,
  active,
  selected,
  expanded,
  onClick,
  delay,
  barRefs,
  isPlaying,
}: {
  member: TribeMemberSummary;
  size: "lg" | "sm" | "xs";
  active: boolean;
  selected: boolean;
  expanded: boolean;
  onClick: () => void;
  delay: number;
  barRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>;
  isPlaying: boolean;
}) {
  return (
    <motion.div
      layout
      className={`${styles.card} ${styles[size]} ${active ? styles.split : ""} ${
        selected ? styles.selected : ""
      } ${expanded ? styles.expanded : ""}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ layout: { type: "spring", stiffness: 260, damping: 26 }, delay }}
    >
      <motion.button
        layout
        type="button"
        className={`${styles.cardInner} ${expanded ? styles.expandedInner : ""}`}
        onClick={onClick}
        aria-label={expanded ? `Close ${member.name}` : `View ${member.name}`}
      >
        <motion.div layout className={styles.photoWrap}>
          <Image
            src={member.photoUrl}
            alt={member.name}
            fill
            sizes="(max-width: 700px) 90vw, 260px"
            className={styles.photo}
          />

          {member.songUrl && !expanded && (
            <span className={styles.songIndicator}>
              <Music size={12} />
            </span>
          )}

          {expanded && (
            <span className={styles.closeExpanded}>
              <X size={16} />
            </span>
          )}
        </motion.div>

        <motion.div layout className={styles.info}>
          <span className={styles.role}>{member.role}</span>
          <h3>{member.name}</h3>
          <p>
            {yearCourseLine(
              member.year,
              expanded ? member.course : degreeOnly(member.course)
            )}
          </p>

          {expanded && (
            <>
              <p className={styles.expandedBio}>{member.bio}</p>

              {member.songUrl && (
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
                    {isPlaying ? "Now Playing" : "Their Anthem"} · {member.songTitle}
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      </motion.button>
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
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const frameRef = useRef<number | null>(null);

  const selectedMember = members.find((member) => member.id === selectedId) ?? null;

  // Below this width the desktop side-by-side "grid rail + detail panel"
  // split (see the .container.split rules) has no room to breathe, so on
  // phones the selected card expands in place within the grid instead —
  // matches the width this component's own 900px split breakpoint already
  // treats as "too narrow for the side panel."
  useEffect(() => {
    function updateIsMobile() {
      setIsMobile(window.innerWidth <= 900);
    }

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

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

  // Stop playback if the visitor navigates away from the page entirely,
  // not just when they close the detail panel.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  function select(id: string) {
    const member = members.find((m) => m.id === id) ?? null;
    const audio = audioRef.current;

    if (member?.songUrl && audio) {
      audio.src = member.songUrl;
      audio.currentTime = 0;
      // Switching between members' anthems quickly can set a new src
      // before the previous play() promise settles, which rejects it with
      // an AbortError — expected and harmless, so it's swallowed rather
      // than surfacing as an unhandled rejection.
      audio.play().catch(() => {});
    }

    setSelectedId(id);
  }

  // On phones there's no separate detail panel to hit a "Back" button in —
  // the card itself is the expanded detail view, so tapping it again is how
  // it collapses.
  function toggleSelect(id: string) {
    if (isMobile && selectedId === id) {
      closeDetail();
    } else {
      select(id);
    }
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

      <div
        className={`${styles.container} ${
          selectedMember && !isMobile ? styles.split : ""
        }`}
      >
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
                    active={!!selectedMember && !isMobile}
                    selected={selectedId === member.id}
                    expanded={isMobile && selectedId === member.id}
                    onClick={() => toggleSelect(member.id)}
                    delay={i * 0.08}
                    barRefs={barRefs}
                    isPlaying={isPlaying}
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
                    active={!!selectedMember && !isMobile}
                    selected={selectedId === member.id}
                    expanded={isMobile && selectedId === member.id}
                    onClick={() => toggleSelect(member.id)}
                    delay={(i % 8) * 0.06}
                    barRefs={barRefs}
                    isPlaying={isPlaying}
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
                    size="xs"
                    active={!!selectedMember && !isMobile}
                    selected={selectedId === member.id}
                    expanded={isMobile && selectedId === member.id}
                    onClick={() => toggleSelect(member.id)}
                    delay={(i % 8) * 0.06}
                    barRefs={barRefs}
                    isPlaying={isPlaying}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {selectedMember && !isMobile && (
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
                    {yearCourseLine(selectedMember.year, selectedMember.course)}
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

      {/* No crossOrigin here: the R2 CDN these songs are hosted on doesn't
          send Access-Control-Allow-Origin, and "crossOrigin" forces the
          browser to fetch in CORS mode — which fails the load outright
          (no playback at all) instead of just losing the visualizer.
          Without it, playback works normally; the analyser above just
          can't read frequency data from a cross-origin, non-CORS source,
          so the bars stay flat rather than erroring. */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </section>
  );
}
