"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

  async function handleClick(trekId: string) {
    if (!poll) return;

    // Voting is one-shot — once myVote is set, cards are read-only reveals.
    if (poll.myVote) return;

    if (!poll.loggedIn) {
      router.push("/login");
      return;
    }

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

  const revealed = Boolean(poll.myVote);

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>
          <Trophy size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
          FAVOURITE TRIP
        </span>
        <h2>Which Trip Did You Love Most?</h2>
        <p className={styles.subtitle}>
          {revealed
            ? "Thanks for voting — here's how everyone else feels."
            : "Cast your vote to see how everyone else feels."}
        </p>
      </div>

      <div className={styles.grid}>
        {poll.options.map((option, i) => {
          const percent =
            poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
          const isMine = poll.myVote === option.trekId;

          return (
            <motion.button
              key={option.trekId}
              type="button"
              className={`${styles.card} ${isMine ? styles.cardVoted : ""}`}
              onClick={() => handleClick(option.trekId)}
              disabled={revealed || voting === option.trekId}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={revealed ? undefined : { y: -6 }}
            >
              <Image
                src={option.coverImage}
                alt={option.title}
                fill
                sizes="(max-width: 700px) 45vw, 220px"
                className={styles.cardImage}
              />

              <div className={styles.cardOverlay} />

              {isMine && (
                <span className={styles.votedBadge}>
                  <Check size={14} />
                </span>
              )}

              <div className={styles.cardContent}>
                <strong>{option.title}</strong>
                <span className={styles.destination}>{option.destination}</span>

                {revealed && (
                  <>
                    <div className={styles.barTrack}>
                      <motion.div
                        className={styles.barFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.7, delay: i * 0.05 + 0.15 }}
                      />
                    </div>
                    <span className={styles.percent}>
                      {percent}% · {option.voteCount} vote{option.voteCount === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
