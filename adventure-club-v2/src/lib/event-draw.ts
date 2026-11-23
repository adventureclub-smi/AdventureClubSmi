// The random team draw for a Campus Event (Trek.type === "EVENT") — turns a
// flat list of individual sign-ups into equally-sized teams automatically.
// Runs once, atomically, from a stored seed, so the result is
// reproducible/auditable rather than "trust me" — see EventRegistration's
// and Trek.eventDrawSeed's comments in schema.prisma. Registration is
// individual only (no buddy pairing) and nothing about gender factors into
// the deal — this only ever balances team size.

import { splitIntoGroups } from "./event-groups";

export type DrawnTeam = {
  name: string;
  colour: string;
  groupNumber: number | null;
  registrationIds: string[];
};

export type DrawResult = {
  seed: string;
  teams: DrawnTeam[];
};

// A fixed, distinct palette so every auto-drawn team gets its own colour
// without the admin having to pick one — cycles if there are ever more
// teams than colours.
const TEAM_COLOURS = [
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Purple",
  "Orange",
  "Teal",
  "Pink",
  "Maroon",
  "Indigo",
  "Cyan",
  "Gold",
];

// Deterministic, seedable PRNG (mulberry32) — a real Math.random() draw
// can't be replayed for an audit later; this can, from the seed alone.
function mulberry32(seedInt: number) {
  let a = seedInt;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedToInt(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  return hash;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Deals registrations round-robin across `numTeams` shuffled teams, so team
// sizes never differ by more than one — the only thing this balances is
// headcount.
function dealEqually(
  registrationIds: string[],
  numTeams: number,
  random: () => number
): string[][] {
  const teams: string[][] = Array.from({ length: numTeams }, () => []);
  const shuffled = shuffle(registrationIds, random);

  shuffled.forEach((id, i) => {
    teams[i % numTeams].push(id);
  });

  return teams;
}

export function runEventDraw(params: {
  registrationIds: string[];
  teamSize: number;
  matchesPerTeamCap: number;
  seed?: string;
}): DrawResult {
  const seed = params.seed ?? `${Date.now()}-${Math.random()}`;
  const random = mulberry32(seedToInt(seed));

  const totalPeople = params.registrationIds.length;
  const numTeams = Math.max(2, Math.round(totalPeople / Math.max(1, params.teamSize)));

  const rosters = dealEqually(params.registrationIds, numTeams, random);

  // The group split only cares about *how many* teams there are, so the
  // team order (already randomized by the deal above) is shuffled once
  // more here purely to avoid any pattern in which team lands in which
  // group.
  const teamOrder = shuffle(
    rosters.map((registrationIds, i) => ({ registrationIds, i })),
    random
  );
  const groupNumbers = splitIntoGroups(numTeams, params.matchesPerTeamCap);
  const numGroups = new Set(groupNumbers).size;

  const teams: DrawnTeam[] = teamOrder.map(({ registrationIds }, idx) => ({
    name: `Team ${idx + 1}`,
    colour: TEAM_COLOURS[idx % TEAM_COLOURS.length],
    groupNumber: numGroups > 1 ? groupNumbers[idx] : null,
    registrationIds,
  }));

  return { seed, teams };
}
