// Scheduling helpers for a Campus Event's league stage — every team sits in
// one combined table (no separate groups), but each team only plays a
// capped number of randomly-chosen opponents rather than a full round
// robin, e.g. 8 teams with a cap of 5 means each team plays a random 5 of
// the other 7. See src/lib/event-draw.ts for the team draw itself and
// src/lib/event-playoff.ts for the knockout stage that follows.

// Deterministic, seedable PRNG (mulberry32) — a real Math.random() draw
// can't be replayed for an audit later; this can, from the seed alone.
export function mulberry32(seedInt: number) {
  let a = seedInt;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedToInt(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  return hash;
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Builds a schedule where every team plays exactly `matchesPerTeam`
// opponents (or all of them, if there aren't enough teams to reach the
// cap) — a regular graph on the shuffled team order, using the classic
// circulant construction: connect each team to the teams `d` seats away
// (in both directions) for distances 1, 2, ... until the target is hit,
// plus the single diametrically-opposite team (distance n/2, only when the
// team count is even) to land on an odd cap exactly. Shuffling the team
// order first means *which* real teams land on a given distance is random,
// while the distances themselves stay a clean, provably-equal structure —
// no retry loops, no team ever ends up with more or fewer opponents than
// any other.
export function generateLeagueSchedule(
  teamIds: string[],
  matchesPerTeam: number,
  random: () => number
): { teamAId: string; teamBId: string }[] {
  const n = teamIds.length;
  if (n < 2) return [];

  let r = Math.min(Math.max(1, matchesPerTeam), n - 1);

  const hasHalf = n % 2 === 0;
  const half = n / 2;

  // An r-regular graph on n vertices only exists when n*r is even — if n is
  // odd, r must be even. Step down by one (stay within the cap) rather than
  // silently exceed it.
  if (!hasHalf && r % 2 === 1) r -= 1;

  const maxDoubleDistance = hasHalf ? half - 1 : Math.floor((n - 1) / 2);

  const order = shuffle(teamIds, random);
  const pairs: { teamAId: string; teamBId: string }[] = [];

  let remaining = r;

  for (let d = 1; d <= maxDoubleDistance && remaining >= 2; d++) {
    for (let i = 0; i < n; i++) {
      const j = (i + d) % n;
      pairs.push({ teamAId: order[i], teamBId: order[j] });
    }
    remaining -= 2;
  }

  if (remaining >= 1 && hasHalf) {
    for (let i = 0; i < half; i++) {
      const j = (i + half) % n;
      pairs.push({ teamAId: order[i], teamBId: order[j] });
    }
    remaining -= 1;
  }

  return pairs;
}
