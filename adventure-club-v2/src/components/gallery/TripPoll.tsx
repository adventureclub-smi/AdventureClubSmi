"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Trophy } from "lucide-react";

import styles from "./TripPoll.module.scss";

type PollOption = {
  trekId: string;
  title: string;
  destination: string;
  coverImage: string;
  voteCount: number;
};

type PollState = {
  options: PollOption[];
  totalVotes: number;
  loggedIn: boolean;
  myVote: string | null;
};

export default function TripPoll() {
  const [poll, setPoll] = useState<PollState | null>(null);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/poll/trips");
        if (!active || !res.ok) return;
        const data = await res.json();
        setPoll(data);
      } catch {
        // Poll just won't render if this fails — non-critical section.
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function vote(trekId: string) {
    if (!poll?.loggedIn || voting) return;

    setVoting(trekId);

    try {
      const res = await fetch("/api/poll/trips/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId }),
      });

      if (!res.ok) return;

      const refreshed = await fetch("/api/poll/trips");
      if (refreshed.ok) setPoll(await refreshed.json());
    } finally {
      setVoting(null);
    }
  }

  if (!poll || poll.options.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>
          <Trophy size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
          FAVOURITE TRIP
        </span>
        <h2>Which Trip Did You Love Most?</h2>
        <p className={styles.subtitle}>Vote for your favorite adventure so far.</p>
      </div>

      {!poll.loggedIn && (
        <p className={styles.loginPrompt}>
          <Link href="/login">Log in</Link> to cast your vote — here&apos;s how everyone else voted so far.
        </p>
      )}

      <div className={styles.list}>
        {poll.options.map((option, i) => {
          const percent =
            poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
          const isMine = poll.myVote === option.trekId;

          return (
            <motion.button
              key={option.trekId}
              type="button"
              className={`${styles.option} ${isMine ? styles.optionVoted : ""}`}
              onClick={() => vote(option.trekId)}
              disabled={!poll.loggedIn || voting === option.trekId}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className={styles.thumb}>
                <Image
                  src={option.coverImage}
                  alt={option.title}
                  fill
                  sizes="64px"
                  className={styles.thumbImage}
                />
              </div>

              <div className={styles.info}>
                <div className={styles.infoTop}>
                  <strong>{option.title}</strong>
                  <span>
                    {option.voteCount} vote{option.voteCount === 1 ? "" : "s"} · {percent}%
                  </span>
                </div>

                <p className={styles.destination}>{option.destination}</p>

                <div className={styles.barTrack}>
                  <motion.div
                    className={styles.barFill}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                  />
                </div>
              </div>

              {isMine && (
                <span className={styles.votedBadge}>
                  <Check size={16} />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
