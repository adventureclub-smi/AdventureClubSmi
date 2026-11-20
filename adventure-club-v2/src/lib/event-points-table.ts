// Computes a Campus Event's group-stage standings on the fly from its
// completed EventMatch rows, rather than storing a running table — the
// matches themselves stay the single source of truth.

export type StandingsMatch = {
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  status: string;
  groupNumber: number | null;
};

export type StandingsTeam = {
  id: string;
  name: string;
  groupNumber: number | null;
};

export type StandingsRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  qualified: boolean;
};

const POINTS_PER_WIN = 2;

function seededTiebreak(teamId: string, seed: string): number {
  let hash = 0;
  const str = `${seed}:${teamId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// Returns one table per group (a single-group event is just one entry),
// each already sorted and with the qualifying cutoff for that group marked.
export function computeGroupStandings(
  teams: StandingsTeam[],
  matches: StandingsMatch[],
  qualifiersCount: number,
  seed: string
): { groupNumber: number | null; rows: StandingsRow[] }[] {
  const groupNumbers = Array.from(new Set(teams.map((t) => t.groupNumber))).sort(
    (a, b) => (a ?? 0) - (b ?? 0)
  );

  const numGroups = groupNumbers.length || 1;
  // Spread the qualifier count as evenly as possible across groups — e.g. 6
  // qualifiers over 3 groups is 2 each; over 2 groups is 3 each. Any
  // remainder (which only comes up if group sizes end up uneven) goes to
  // the earliest groups.
  const baseQualifiersPerGroup = Math.floor(qualifiersCount / numGroups);
  const extraQualifierGroups = qualifiersCount % numGroups;

  return groupNumbers.map((groupNumber, groupIdx) => {
    const groupTeams = teams.filter((t) => t.groupNumber === groupNumber);
    const groupMatches = matches.filter(
      (m) => m.groupNumber === groupNumber && m.status === "COMPLETED"
    );

    const rows: StandingsRow[] = groupTeams.map((team) => {
      const played = groupMatches.filter(
        (m) => m.teamAId === team.id || m.teamBId === team.id
      );
      const won = played.filter((m) => m.winnerTeamId === team.id).length;
      const lost = played.length - won;

      return {
        teamId: team.id,
        teamName: team.name,
        played: played.length,
        won,
        lost,
        points: won * POINTS_PER_WIN,
        qualified: false,
      };
    });

    rows.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;

      // Two teams tied on points who played each other — the head-to-head
      // result breaks the tie before falling back to anything else.
      const headToHead = groupMatches.find(
        (m) =>
          (m.teamAId === a.teamId && m.teamBId === b.teamId) ||
          (m.teamBId === a.teamId && m.teamAId === b.teamId)
      );
      if (headToHead?.winnerTeamId === a.teamId) return -1;
      if (headToHead?.winnerTeamId === b.teamId) return 1;

      // No usable head-to-head (or a genuine 3+-way tie) — fall back to a
      // seeded, reproducible tiebreak rather than an arbitrary/silent one.
      return seededTiebreak(a.teamId, seed) - seededTiebreak(b.teamId, seed);
    });

    const qualifiersForThisGroup =
      baseQualifiersPerGroup + (groupIdx < extraQualifierGroups ? 1 : 0);

    rows.forEach((row, i) => {
      row.qualified = i < qualifiersForThisGroup;
    });

    return { groupNumber, rows };
  });
}
