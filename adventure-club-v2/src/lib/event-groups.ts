// Group-stage helpers for a Campus Event (Trek.type === "EVENT"). Team
// formation itself is physical (chit picking on the day) and is never
// decided by this code — see Trek's Campus Events schema comment — so all
// that's left here is splitting an already-admin-created list of teams into
// round-robin groups small enough to respect the match cap.

// Splits `numTeams` into as few groups as possible such that a full round
// robin within any one group never exceeds `matchesPerTeamCap` matches per
// team (group size = cap + 1) — e.g. 8 teams with a cap of 4 becomes two
// groups of 4 (3 matches each), instead of one group of 8 (7 matches each).
export function splitIntoGroups(numTeams: number, matchesPerTeamCap: number): number[] {
  const maxGroupSize = matchesPerTeamCap + 1;
  const numGroups = Math.max(1, Math.ceil(numTeams / maxGroupSize));

  const base = Math.floor(numTeams / numGroups);
  const remainder = numTeams % numGroups;

  const groupNumbers: number[] = [];
  for (let g = 0; g < numGroups; g++) {
    const size = base + (g < remainder ? 1 : 0);
    for (let i = 0; i < size; i++) groupNumbers.push(g + 1);
  }

  return groupNumbers;
}
