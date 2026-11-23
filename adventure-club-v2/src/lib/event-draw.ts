// The random team draw for a Campus Event (Trek.type === "EVENT") — turns a
// flat list of individual sign-ups into equally-sized teams automatically.
// Runs once, atomically, from a stored seed, so the result is
// reproducible/auditable rather than "trust me" — see EventRegistration's
// and Trek.eventDrawSeed's comments in schema.prisma. Registration is
// individual only (no buddy pairing) and nothing about gender factors into
// the deal — this only ever balances team size. Fixture scheduling itself
// lives in event-groups.ts (league stage) and event-playoff.ts (knockout
// stage), not here.

import { mulberry32, seedToInt, shuffle } from "./event-groups";

export type DrawnTeam = {
  name: string;
  colour: string;
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
  seed?: string;
}): DrawResult {
  const seed = params.seed ?? `${Date.now()}-${Math.random()}`;
  const random = mulberry32(seedToInt(seed));

  const totalPeople = params.registrationIds.length;
  const numTeams = Math.max(2, Math.round(totalPeople / Math.max(1, params.teamSize)));

  const rosters = dealEqually(params.registrationIds, numTeams, random);

  // Team order is already randomized by the deal above, but shuffle once
  // more so colour assignment doesn't correlate with roster order either.
  const teamOrder = shuffle(rosters, random);

  const teams: DrawnTeam[] = teamOrder.map((registrationIds, idx) => ({
    name: `Team ${idx + 1}`,
    colour: TEAM_COLOURS[idx % TEAM_COLOURS.length],
    registrationIds,
  }));

  return { seed, teams };
}
