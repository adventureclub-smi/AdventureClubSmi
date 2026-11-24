"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { colourToHex } from "@/lib/team-colours";
import { PLAYOFF_ROUND_LABELS, PLAYOFF_ROUND_ORDER, type PlayoffRound } from "@/lib/event-playoff";
import styles from "./EventDisplay.module.scss";

type Team = { id: string; name: string; colour: string; members?: string[] };

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
  tournamentStarted?: boolean;
};

type CelebrationInfo = {
  team: Team;
  isChampion: boolean;
  scoreLine: string;
};

const VIEWS = [
  { key: "points", label: "Points table" },
  { key: "fixtures", label: "Fixtures" },
  { key: "teams", label: "Teams" },
  { key: "playoff", label: "Playoffs" },
] as const;
type View = (typeof VIEWS)[number]["key"];

const AUTO_CYCLE_MS = 15000;

function teamOf(teams: Team[], id: string | null) {
  return teams.find((t) => t.id === id) ?? null;
}

// How far the rope has been pulled toward A (positive) or B (negative) — one
// step per round a team has already won, plus the knockout decider when it
// was needed. A round that hasn't been played yet contributes nothing, so
// an in-progress match shows a partial pull rather than snapping straight
// to a result.
function ropePull(match: Match, deciderWinnerId: string | null) {
  let pull = 0;
  if (match.round1WinnerId) pull += match.round1WinnerId === match.teamAId ? 1 : -1;
  if (match.round2WinnerId) pull += match.round2WinnerId === match.teamAId ? 1 : -1;
  if (deciderWinnerId) pull += deciderWinnerId === match.teamAId ? 1 : -1;
  return pull;
}

function RopeMatch({ match, teams }: { match: Match; teams: Team[] }) {
  const teamA = teamOf(teams, match.teamAId);
  const teamB = teamOf(teams, match.teamBId);
  const completed = match.status === "COMPLETED";

  if (!match.teamBId) {
    return (
      <div className={styles.matchCard}>
        <span className={styles.teamNameLeft}>{teamA?.name ?? "TBD"}</span>
        <span className={styles.byeTag}>Bye — advances</span>
      </div>
    );
  }

  // A knockout match that split 1-1 is decided by a third round, recorded
  // as the match's winner directly (there's no separate round3 field) —
  // only true when the two rounds actually ended level.
  const wentToDecider = match.stage === "KNOCKOUT" && match.teamAScore === 1 && match.teamBScore === 1;
  const deciderWinnerId = wentToDecider ? match.winnerTeamId : null;

  const pull = ropePull(match, deciderWinnerId);
  const step = 14;
  const knotPercent = 50 - pull * step;
  const leadingTeam = pull > 0 ? teamA : pull < 0 ? teamB : null;

  return (
    <div className={`${styles.matchCard} ${completed ? styles.matchDone : ""}`}>
      <span className={`${styles.teamNameLeft} ${match.winnerTeamId === teamA?.id ? styles.sideWon : ""}`}>
        {teamA?.name ?? "TBD"}
      </span>

      <div className={styles.ropeTrack}>
        <div className={styles.ropeBase} />
        {pull !== 0 && (
          <motion.div
            className={styles.ropePulled}
            style={{
              background: colourToHex(leadingTeam?.colour ?? ""),
              left: pull > 0 ? `${knotPercent}%` : "50%",
              right: pull > 0 ? "50%" : `${100 - knotPercent}%`,
            }}
            layout
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        )}
        <motion.div
          className={styles.ropeKnot}
          style={{ background: colourToHex(leadingTeam?.colour ?? "") }}
          animate={{ left: `${knotPercent}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        />
      </div>

      <span className={`${styles.teamNameRight} ${match.winnerTeamId === teamB?.id ? styles.sideWon : ""}`}>
        {teamB?.name ?? "TBD"}
      </span>

      <span className={styles.scoreText}>
        {completed ? (match.winnerTeamId === null ? "Draw" : `${match.teamAScore ?? 0}–${match.teamBScore ?? 0}`) : "vs"}
      </span>
    </div>
  );
}

export default function EventDisplay({ eventId }: { eventId: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [view, setView] = useState<View>("points");
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  const prevStatusRef = useRef<Record<string, string>>({});
  const dataRef = useRef<Overview | null>(null);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function availableViews(overview: Overview | null) {
    const hasPlayoff = (overview?.knockoutMatches.length ?? 0) > 0;
    return hasPlayoff ? VIEWS : VIEWS.filter((v) => v.key !== "playoff");
  }

  function restartCycle() {
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleTimer.current = setInterval(() => {
      const views = availableViews(dataRef.current);
      setView((current) => {
        const i = views.findIndex((v) => v.key === current);
        return views[(i + 1) % views.length].key;
      });
    }, AUTO_CYCLE_MS);
  }

  function selectView(key: View) {
    setView(key);
    restartCycle();
  }

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
              scoreLine: `${justCompleted.teamAScore ?? 0}–${justCompleted.teamBScore ?? 0}`,
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
    restartCycle();
    return () => {
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!celebration) return;
    const timeout = setTimeout(() => setCelebration(null), celebration.isChampion ? 7000 : 4500);
    return () => clearTimeout(timeout);
  }, [celebration]);

  if (!data) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading tournament…</p>
      </div>
    );
  }

  const { event, teams, groupMatches, knockoutMatches, standings } = data;
  const views = availableViews(data);
  const rows = standings[0]?.rows ?? [];
  const topPoints = Math.max(1, ...rows.map((r) => r.points));

  const playoffMatch = (round: PlayoffRound) => knockoutMatches.find((m) => m.round === round);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.liveTag}>
          <span className={styles.liveDot} />
          Live
        </span>
        <h1 className={styles.title}>{event.title}</h1>

        <nav className={styles.tabs}>
          {views.map((v) => (
            <button
              key={v.key}
              type="button"
              className={view === v.key ? styles.tabActive : styles.tab}
              onClick={() => selectView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {view === "points" && (
            <motion.section
              key="points"
              className={styles.panel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
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
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                >
                  <span className={styles.colTeam}>
                    <span className={styles.rank}>{idx + 1}</span>
                    <span className={styles.dot} style={{ background: colourToHex(row.teamColour) }} />
                    {row.teamName}
                    {row.qualified && <span className={styles.qualifiedWord}>Playoffs</span>}
                  </span>
                  <span>{row.played}</span>
                  <span>{row.won}</span>
                  <span>{row.drawn}</span>
                  <span>{row.lost}</span>
                  <span className={styles.colPts}>
                    <span className={styles.pullBarTrack}>
                      <motion.span
                        className={styles.pullBarFill}
                        style={{ background: colourToHex(row.teamColour) }}
                        animate={{ width: `${(row.points / topPoints) * 100}%` }}
                        transition={{ type: "spring", stiffness: 200, damping: 30 }}
                      />
                    </span>
                    {row.points}
                  </span>
                </motion.div>
              ))}

              {rows.length === 0 && <p className={styles.emptyNote}>Teams haven&apos;t been drawn yet.</p>}

              {rows.length > 0 && (
                <p className={styles.legend}>
                  Win a round, win a point. Sweep both rounds in a match and take the bonus point too — three
                  points altogether. Split the rounds and you each leave with one. The top four move on to the
                  playoffs.
                </p>
              )}
            </motion.section>
          )}

          {view === "fixtures" && (
            <motion.section
              key="fixtures"
              className={styles.panel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.fixturesList}>
                {groupMatches.map((match) => (
                  <RopeMatch key={match.id} match={match} teams={teams} />
                ))}
                {groupMatches.length === 0 && <p className={styles.emptyNote}>Fixtures aren&apos;t out yet.</p>}
              </div>
            </motion.section>
          )}

          {view === "teams" && (
            <motion.section
              key="teams"
              className={styles.panel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.teamsGrid}>
                {teams.map((team) => (
                  <div key={team.id} className={styles.teamBlock}>
                    <div className={styles.teamBlockHead} style={{ background: colourToHex(team.colour) }}>
                      {team.name}
                    </div>
                    <ul className={styles.teamRoster}>
                      {(team.members ?? []).map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                      {(!team.members || team.members.length === 0) && <li className={styles.emptyNote}>—</li>}
                    </ul>
                  </div>
                ))}
                {teams.length === 0 && <p className={styles.emptyNote}>Teams haven&apos;t been drawn yet.</p>}
              </div>
            </motion.section>
          )}

          {view === "playoff" && (
            <motion.section
              key="playoff"
              className={styles.panel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <p className={styles.legend}>
                Knockout matches are played best of three — if the first two rounds split, a third round decides it.
              </p>
              <div className={styles.playoffGrid}>
                {PLAYOFF_ROUND_ORDER.map((round) => {
                  const match = playoffMatch(round);
                  return (
                    <div key={round} className={styles.playoffStep}>
                      <h3>{PLAYOFF_ROUND_LABELS[round]}</h3>
                      {match ? (
                        <RopeMatch match={match} teams={teams} />
                      ) : (
                        <div className={styles.matchCard}>
                          <p className={styles.emptyNote} style={{ margin: 0 }}>
                            Not set yet
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.section>
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
              className={styles.celebrationField}
              style={{ background: colourToHex(celebration.team.colour) }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.15 }}
              className={styles.celebrationContent}
            >
              <span className={styles.celebrationKicker}>{celebration.isChampion ? "Champions" : "Winner"}</span>
              <h2 className={styles.celebrationName}>{celebration.team.name}</h2>
              <span className={styles.celebrationScore}>{celebration.scoreLine}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
