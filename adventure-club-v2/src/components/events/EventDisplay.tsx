"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { colourToHex } from "@/lib/team-colours";
import { PLAYOFF_ROUND_LABELS, PLAYOFF_ROUND_ORDER, type PlayoffRound } from "@/lib/event-playoff";
import styles from "./EventDisplay.module.scss";

type Team = { id: string; name: string; colour: string };

type Match = {
  id: string;
  stage: string;
  round: string | null;
  teamAId: string;
  teamBId: string | null;
  round1WinnerId: string | null;
  round2WinnerId: string | null;
  teamAScore: number | null;
  teamBScore: number | null;
  winnerTeamId: string | null;
  status: string;
};

type StandingsRow = {
  teamId: string;
  teamName: string;
  teamColour: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  qualified: boolean;
};

type Overview = {
  event: { id: string; title: string; eventFormat: string };
  teams: Team[];
  groupMatches: Match[];
  knockoutMatches: Match[];
  standings: { rows: StandingsRow[] }[];
};

type CelebrationInfo = {
  team: Team;
  isChampion: boolean;
  scoreLine: string;
};

const VIEWS = ["points", "fixtures", "playoff"] as const;
type View = (typeof VIEWS)[number];

function teamOf(teams: Team[], id: string | null) {
  return teams.find((t) => t.id === id) ?? null;
}

function TeamChip({ team, big }: { team: Team | null; big?: boolean }) {
  if (!team) return <span className={styles.tbd}>TBD</span>;
  return (
    <span className={big ? styles.teamChipBig : styles.teamChip}>
      <span className={styles.dot} style={{ background: colourToHex(team.colour) }} />
      {team.name}
    </span>
  );
}

function RoundPip({
  teamId,
  winnerId,
  team,
}: {
  teamId: string | null;
  winnerId: string | null;
  team: Team | null;
}) {
  const decided = !!winnerId;
  const won = decided && winnerId === teamId;
  return (
    <span
      className={styles.pip}
      style={
        decided
          ? {
              background: won ? colourToHex(team?.colour ?? "") : "transparent",
              borderColor: won ? colourToHex(team?.colour ?? "") : "rgba(245,245,245,0.2)",
              opacity: won ? 1 : 0.35,
            }
          : undefined
      }
    />
  );
}

function MatchCard({ match, teams }: { match: Match; teams: Team[] }) {
  const teamA = teamOf(teams, match.teamAId);
  const teamB = teamOf(teams, match.teamBId);
  const completed = match.status === "COMPLETED";

  if (!match.teamBId) {
    return (
      <div className={styles.matchCard}>
        <div className={styles.matchRow}>
          <TeamChip team={teamA} />
          <span className={styles.byeTag}>BYE</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.matchCard} ${completed ? styles.matchDone : ""}`}>
      <div className={styles.matchRow}>
        <div className={`${styles.matchSide} ${match.winnerTeamId === teamA?.id ? styles.sideWon : ""}`}>
          <TeamChip team={teamA} />
          <div className={styles.pips}>
            <RoundPip teamId={teamA?.id ?? null} winnerId={match.round1WinnerId} team={teamA} />
            <RoundPip teamId={teamA?.id ?? null} winnerId={match.round2WinnerId} team={teamA} />
          </div>
        </div>

        <span className={styles.vs}>
          {completed
            ? match.winnerTeamId === null
              ? "DRAW"
              : `${match.teamAScore ?? 0} – ${match.teamBScore ?? 0}`
            : "VS"}
        </span>

        <div className={`${styles.matchSide} ${styles.matchSideRight} ${match.winnerTeamId === teamB?.id ? styles.sideWon : ""}`}>
          <div className={styles.pips}>
            <RoundPip teamId={teamB?.id ?? null} winnerId={match.round2WinnerId} team={teamB} />
            <RoundPip teamId={teamB?.id ?? null} winnerId={match.round1WinnerId} team={teamB} />
          </div>
          <TeamChip team={teamB} />
        </div>
      </div>
    </div>
  );
}

export default function EventDisplay({ eventId }: { eventId: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  const prevStatusRef = useRef<Record<string, string>>({});
  const dataRef = useRef<Overview | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        // preview=1 only has any effect for an authenticated admin/core-team
        // viewer (see the API route) — it lets the TV display be used to
        // check the setup before the tournament is actually started, while
        // an anonymous visitor on this same link still sees nothing early.
        const res = await fetch(`/api/events/${eventId}/public?preview=1`, { cache: "no-store" });
        const json = await res.json();
        if (!active || !json?.event) return;

        const allMatches: Match[] = [...(json.groupMatches ?? []), ...(json.knockoutMatches ?? [])];
        const prevStatus = prevStatusRef.current;
        const justCompleted = allMatches.find(
          (m) => m.status === "COMPLETED" && prevStatus[m.id] && prevStatus[m.id] !== "COMPLETED"
        );

        if (justCompleted && justCompleted.winnerTeamId) {
          const team = teamOf(json.teams as Team[], justCompleted.winnerTeamId);
          if (team) {
            setCelebration({
              team,
              isChampion: justCompleted.round === "FINAL",
              scoreLine:
                justCompleted.winnerTeamId === null
                  ? "Drew"
                  : `${justCompleted.teamAScore ?? 0} – ${justCompleted.teamBScore ?? 0}`,
            });
          }
        }

        prevStatusRef.current = Object.fromEntries(allMatches.map((m) => [m.id, m.status]));
        dataRef.current = json;
        setData(json);
      } catch {
        // A TV has no one to show a network error to — the next poll recovers.
      }
    }

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [eventId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasPlayoff = (dataRef.current?.knockoutMatches.length ?? 0) > 0;
      const total = hasPlayoff ? VIEWS.length : VIEWS.length - 1;
      setViewIndex((i) => (i + 1) % total);
    }, 14000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!celebration) return;
    const timeout = setTimeout(() => setCelebration(null), celebration.isChampion ? 7000 : 4500);
    return () => clearTimeout(timeout);
  }, [celebration]);

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading tournament...</div>
      </div>
    );
  }

  const { event, teams, groupMatches, knockoutMatches, standings } = data;
  const hasPlayoff = knockoutMatches.length > 0;
  const view: View = hasPlayoff ? VIEWS[viewIndex] : VIEWS.filter((v) => v !== "playoff")[viewIndex];
  const rows = standings[0]?.rows ?? [];

  const playoffMatch = (round: PlayoffRound) => knockoutMatches.find((m) => m.round === round);

  return (
    <div className={styles.page}>
      <div className={styles.glow} />

      <header className={styles.header}>
        <div className={styles.liveTag}>
          <span className={styles.liveDot} />
          LIVE
        </div>
        <h1 className={styles.title}>{event.title}</h1>
        <div className={styles.tabs}>
          <span className={view === "points" ? styles.tabActive : ""}>Points Table</span>
          <span className={view === "fixtures" ? styles.tabActive : ""}>Fixtures</span>
          {hasPlayoff && <span className={view === "playoff" ? styles.tabActive : ""}>Playoffs</span>}
        </div>
      </header>

      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {view === "points" && (
            <motion.div
              key="points"
              className={styles.pointsPanel}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.tableHead}>
                <span className={styles.colTeam}>Team</span>
                <span>P</span>
                <span>W</span>
                <span>D</span>
                <span>L</span>
                <span className={styles.colPts}>Pts</span>
              </div>
              {rows.map((row, idx) => (
                <motion.div
                  layout
                  key={row.teamId}
                  className={`${styles.tableRow} ${row.qualified ? styles.rowQualified : ""}`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <span className={styles.colTeam}>
                    <span className={styles.rank}>{idx + 1}</span>
                    <span className={styles.dot} style={{ background: colourToHex(row.teamColour) }} />
                    {row.teamName}
                    {row.qualified && <span className={styles.qualifiedTag}>Playoff</span>}
                  </span>
                  <span>{row.played}</span>
                  <span>{row.won}</span>
                  <span>{row.drawn}</span>
                  <span>{row.lost}</span>
                  <span className={styles.colPts}>{row.points}</span>
                </motion.div>
              ))}
              {rows.length === 0 && <p className={styles.emptyNote}>Teams haven&apos;t been drawn yet.</p>}
            </motion.div>
          )}

          {view === "fixtures" && (
            <motion.div
              key="fixtures"
              className={styles.fixturesPanel}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.fixturesGrid}>
                {groupMatches.map((match) => (
                  <MatchCard key={match.id} match={match} teams={teams} />
                ))}
                {groupMatches.length === 0 && <p className={styles.emptyNote}>Fixtures aren&apos;t out yet.</p>}
              </div>
            </motion.div>
          )}

          {view === "playoff" && hasPlayoff && (
            <motion.div
              key="playoff"
              className={styles.playoffPanel}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
            >
              {PLAYOFF_ROUND_ORDER.map((round) => {
                const match = playoffMatch(round);
                return (
                  <div key={round} className={styles.playoffStep}>
                    <h3>{PLAYOFF_ROUND_LABELS[round]}</h3>
                    {match ? (
                      <MatchCard match={match} teams={teams} />
                    ) : (
                      <div className={styles.matchCard}>
                        <p className={styles.emptyNote} style={{ margin: 0 }}>
                          Not yet set
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {celebration && (
          <motion.div
            className={styles.celebration}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.celebrationGlow}
              style={{ background: colourToHex(celebration.team.colour) }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
              className={styles.celebrationContent}
            >
              <span className={styles.celebrationKicker}>
                {celebration.isChampion ? "CHAMPIONS" : "WINNER"}
              </span>
              <span className={styles.celebrationDot} style={{ background: colourToHex(celebration.team.colour) }} />
              <h2 className={styles.celebrationName}>{celebration.team.name}</h2>
              <span className={styles.celebrationScore}>{celebration.scoreLine}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
