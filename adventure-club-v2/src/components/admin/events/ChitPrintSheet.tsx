"use client";

import { colourToHex } from "@/lib/team-colours";
import styles from "./ChitPrintSheet.module.scss";

type Team = { id: string; name: string; colour: string; targetSize: number };

// Printable sheet of individually-cuttable chits, the correct count per
// team — these get cut apart and mixed in a bag for participants to draw
// from physically. This page never decides who gets which chit; it only
// helps print the right quantities.
export default function ChitPrintSheet({
  eventTitle,
  teams,
}: {
  eventTitle: string;
  teams: Team[];
}) {
  const chits = teams.flatMap((team) =>
    Array.from({ length: Math.max(0, team.targetSize) }, (_, i) => ({
      key: `${team.id}-${i}`,
      team,
    }))
  );

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <h1>{eventTitle} — Chit Sheet</h1>
          <p>
            {chits.length} chits across {teams.length} team(s). Cut along the lines and mix
            thoroughly before participants draw.
          </p>
        </div>
        <button onClick={() => window.print()}>Print</button>
      </div>

      {teams.length === 0 ? (
        <p className={styles.empty}>No teams created yet — add teams first, then come back here.</p>
      ) : (
        <div className={styles.grid}>
          {chits.map(({ key, team }) => (
            <div key={key} className={styles.chit} style={{ borderColor: colourToHex(team.colour) }}>
              <span className={styles.swatch} style={{ background: colourToHex(team.colour) }} />
              <span className={styles.teamName}>{team.name}</span>
              <span className={styles.colourLabel}>{team.colour}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
