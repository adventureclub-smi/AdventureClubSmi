// The random team draw for a Campus Event (Trek.type === "EVENT") — turns a
// flat list of individual sign-ups into equally-sized teams automatically.
// Runs once, atomically, from a stored seed, so the result is
// reproducible/auditable rather than "trust me" — see EventRegistration's
// and Trek.eventDrawSeed's comments in schema.prisma. Registration is
// individual only (no buddy pairing). Teams are balanced on three things,
// in priority order: headcount, the admin's core-member picks spread as
// evenly as possible, then each team's male/female split as evenly as the
// numbers allow (see dealByGenderAndCore below). Fixture scheduling itself
// lives in event-groups.ts (league stage) and event-playoff.ts (knockout
// stage), not here.

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
  // The admin's per-event "spread this person across teams" pick — e.g. a
  // handful of experienced members seeded one-or-two-per-team rather than
  // left to pure chance. Not tied to the person's real club role.
  isCoreMember?: boolean | null;
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

function genderKey(r: GenderedRegistration): "Male" | "Female" | "Other" {
  return r.gender === "Male" || r.gender === "Female" ? r.gender : "Other";
}

// Splits a group into Male / Female / everything-else buckets, each
// shuffled independently, and deals every bucket round-robin across teams
// — `counter` is passed in (and its new value returned) rather than reset
// to 0, so a caller can chain several groups one after another and keep a
// single running rotation across all of them. That's what keeps headcount
// balanced even across groups: resetting per bucket (or per group) would
// let each one's "odd one out" (when it doesn't divide evenly by numTeams)
// land on the same early team every time; carrying the counter forward
// rotates which team absorbs each remainder instead.
function dealGroupByGender(
  teams: string[][],
  group: GenderedRegistration[],
  numTeams: number,
  random: () => number,
  counter: number
): number {
  const buckets = new Map<string, string[]>();
  for (const r of group) {
    const key = genderKey(r);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r.id);
  }

  for (const key of ["Male", "Female", "Other"]) {
    const ids = buckets.get(key);
    if (!ids || ids.length === 0) continue;

    for (const id of shuffle(ids, random)) {
      teams[counter % numTeams].push(id);
      counter++;
    }
  }

  return counter;
}

// Core members are dealt first (their own gender-balanced pass), then
// everyone else — dealing a group as one contiguous pass is what actually
// spreads it evenly across teams; interleaving would lose that. The shared
// counter carries over from the core pass into the rest, so overall
// headcount still comes out balanced across the whole roster, not just
// within each group.
function dealByGenderAndCore(
  registrations: GenderedRegistration[],
  numTeams: number,
  random: () => number
): string[][] {
  const teams: string[][] = Array.from({ length: numTeams }, () => []);

  const core = registrations.filter((r) => r.isCoreMember);
  const rest = registrations.filter((r) => !r.isCoreMember);

  const afterCore = dealGroupByGender(teams, core, numTeams, random, 0);
  dealGroupByGender(teams, rest, numTeams, random, afterCore);

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

  const rosters = dealByGenderAndCore(params.registrations, numTeams, random);

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
