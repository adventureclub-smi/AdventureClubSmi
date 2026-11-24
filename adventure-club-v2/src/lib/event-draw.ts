// The random team draw for a Campus Event (Trek.type === "EVENT") — turns a
// flat list of individual sign-ups into equally-sized teams automatically.
// Runs once, atomically, from a stored seed, so the result is
// reproducible/auditable rather than "trust me" — see EventRegistration's
// and Trek.eventDrawSeed's comments in schema.prisma. Registration is
// individual only (no buddy pairing). Teams are balanced on two things:
// headcount first, then each team's male/female split as evenly as the
// numbers allow (see dealByGender below). Fixture scheduling itself lives
// in event-groups.ts (league stage) and event-playoff.ts (knockout stage),
// not here.

import { mulberry32, seedToInt, shuffle } from "./event-groups";

export type DrawnTeam = {
  name: string;
  colour: string;
  registrationIds: string[];
};

export type GenderedRegistration = {
  id: string;
  // Whatever was stored on EventRegistration.gender — "Male"/"Female" are
  // dealt into balanced halves; anything else (including missing/null) is
  // treated as its own pool and spread evenly across teams last, same as
  // dealEqually, so a draw never breaks just because someone skipped it.
  gender: string | null | undefined;
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

// Splits registrations into Male / Female / everything-else buckets, each
// shuffled independently, then deals every bucket round-robin across teams
// using one counter that keeps running across buckets instead of resetting
// to team 0 for each. That's what keeps headcount balanced too: resetting
// per bucket would let each bucket's "odd one out" (when it doesn't divide
// evenly by numTeams) land on the same early team every time; carrying the
// counter forward rotates which team absorbs each remainder instead.
function dealByGender(
  registrations: GenderedRegistration[],
  numTeams: number,
  random: () => number
): string[][] {
  const teams: string[][] = Array.from({ length: numTeams }, () => []);

  const buckets = new Map<string, string[]>();
  for (const r of registrations) {
    const key = r.gender === "Male" || r.gender === "Female" ? r.gender : "Other";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r.id);
  }

  let counter = 0;
  for (const key of ["Male", "Female", "Other"]) {
    const ids = buckets.get(key);
    if (!ids || ids.length === 0) continue;

    for (const id of shuffle(ids, random)) {
      teams[counter % numTeams].push(id);
      counter++;
    }
  }

  return teams;
}

export function runEventDraw(params: {
  registrations: GenderedRegistration[];
  teamSize: number;
  seed?: string;
}): DrawResult {
  const seed = params.seed ?? `${Date.now()}-${Math.random()}`;
  const random = mulberry32(seedToInt(seed));

  const totalPeople = params.registrations.length;
  const numTeams = Math.max(2, Math.round(totalPeople / Math.max(1, params.teamSize)));

  const rosters = dealByGender(params.registrations, numTeams, random);

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
