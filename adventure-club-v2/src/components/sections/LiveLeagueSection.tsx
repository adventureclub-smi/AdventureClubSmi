"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { colourToHex } from "@/lib/team-colours";
import styles from "./LiveLeagueSection.module.scss";

type Team = { id: string; name: string; colour: string; members?: string[] };

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

type MyTeam = { id: string; name: string; colour: string; members: string[] };

type FeaturedEvent = {
  event: { id: string; title: string; destination: string } | null;
  loggedIn?: boolean;
  isRegistered?: boolean;
  myTeam?: MyTeam | null;
  teams?: Team[];
  standings?: { groupNumber: number | null; rows: StandingsRow[] }[];
};

const POLL_MS = 15000;

// Not part of the ISR-cached homepage render — this fetches client-side on
// its own schedule so "which team am I on" (genuinely per-visitor) and the
// live standings (which change the moment an admin records a result) never
// get baked into the shared cached page. Renders nothing at all until an
// admin has both started a tournament and explicitly featured it (see the
// event admin page's "Feature on Homepage" toggle) — most of the time
// there's no event live, and this section simply isn't there.
//
// The full team-by-team roster (not just "myTeam") is shown to everyone,
// logged in or not — a lot of sign-ups are guests or added on the spot by
// an admin, so "log in to see your team" would leave them with no way to
// ever find out which team they're on. Scanning the roster for your own
// name works regardless of whether you have a NAVIRA account at all.
export default function LiveLeagueSection() {
  const [data, setData] = useState<FeaturedEvent | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/homepage/featured-event", { cache: "no-store" });
        if (!active || !res.ok) return;
        const json = await res.json();
        setData(json);
      } catch {
        // Next poll recovers — no error state for a section that may not
        // even be showing anything right now.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const event = data?.event;

  return (
    <AnimatePresence>
      {event && (
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.container}>
            <div className={styles.liveTag}>
              <span className={styles.liveDot} />
              LIVE NOW
            </div>

            <h2>{event.title}</h2>
            {event.destination && <p className={styles.venue}>{event.destination}</p>}

            {data?.loggedIn && data?.isRegistered && data?.myTeam && (
              <div
                className={styles.myTeamCard}
                style={{ borderColor: colourToHex(data.myTeam.colour) }}
              >
                <span
                  className={styles.swatch}
                  style={{ background: colourToHex(data.myTeam.colour) }}
                />
                <div>
                  <span className={styles.myTeamLabel}>You&apos;re on</span>
                  <strong>{data.myTeam.name}</strong>
                </div>
              </div>
            )}

            {data?.loggedIn && data?.isRegistered && !data?.myTeam && (
              <p className={styles.note}>Teams haven&apos;t been drawn yet — check back soon.</p>
            )}

            {(() => {
              // A lot of sign-ups are guests or added on the spot — people
              // with no NAVIRA account to log into and see "myTeam" above.
              // The full roster is the thing that actually works for
              // everyone: find your own team by scanning for your name.
              const teams = (data?.teams ?? []).filter((t) => (t.members ?? []).length > 0);
              if (teams.length === 0) return null;

              return (
                <div className={styles.rosterSection}>
                  <h3>Teams</h3>
                  <div className={styles.rosterGrid}>
                    {teams.map((team) => (
                      <div key={team.id} className={styles.rosterCard}>
                        <div className={styles.rosterCardHead}>
                          <span
                            className={styles.swatch}
                            style={{ background: colourToHex(team.colour) }}
                          />
                          {team.name}
                        </div>
                        <ul>
                          {(team.members ?? []).map((name, i) => (
                            <li key={`${team.id}-${i}`}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(() => {
              const rows = data?.standings?.[0]?.rows ?? [];
              if (rows.length === 0) return null;

              return (
                <div className={styles.standings}>
                  <div className={styles.standingsHead}>
                    <span>Team</span>
                    <span>P</span>
                    <span>Pts</span>
                  </div>
                  {rows.slice(0, 4).map((row, i) => (
                    <div key={row.teamId} className={styles.standingsRow}>
                      <span className={styles.teamCell}>
                        <span className={styles.rank}>{i + 1}</span>
                        <span
                          className={styles.swatch}
                          style={{ background: colourToHex(row.teamColour) }}
                        />
                        {row.teamName}
                      </span>
                      <span>{row.played}</span>
                      <span className={styles.points}>{row.points}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <a
              href={`/events/${event.id}/display`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.viewLink}
            >
              <Trophy size={15} /> View Full Tournament
            </a>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
