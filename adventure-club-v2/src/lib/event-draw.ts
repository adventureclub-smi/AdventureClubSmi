// The random team draw for a Campus Event (Trek.type === "EVENT") — turns a
// flat list of individual sign-ups into balanced teams, then (if there are
// more teams than one group's round robin can handle) splits those teams
// into groups. Runs once, atomically, from a stored seed, so the result is
// reproducible/auditable rather than "trust me" — see EventRegistration's
// and Trek.eventDrawSeed's comments in schema.prisma.

export type DrawRegistration = {
  id: string;
  userId: string;
  gender: string | null;
  buddyRequestUserId: string | null;
};

export type DrawUnit = {
  // One registration id, or two for a mutually-confirmed buddy pair.
  registrationIds: string[];
  // Lumps "OTHER" / "PREFER_NOT_TO_SAY" / unset together — you can't
  // meaningfully balance a category nobody is tracking.
  genderCounts: { MALE: number; FEMALE: number; OTHER: number };
};

export type DrawnTeam = {
  name: string;
  groupNumber: number | null;
  registrationIds: string[];
};

export type DrawResult = {
  seed: string;
  teams: DrawnTeam[];
};

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

function genderBucket(gender: string | null): "MALE" | "FEMALE" | "OTHER" {
  if (gender === "MALE") return "MALE";
  if (gender === "FEMALE") return "FEMALE";
  return "OTHER";
}

// Pairs up mutually-confirmed buddy requests (A asked for B *and* B asked
// for A) into one unit; everyone else is their own solo unit. A one-sided
// request is simply ignored — nobody can be placed on someone's team
// without that person having asked back.
export function buildDrawUnits(registrations: DrawRegistration[]): DrawUnit[] {
  const byUserId = new Map(registrations.map((r) => [r.userId, r]));
  const consumed = new Set<string>();
  const units: DrawUnit[] = [];

  for (const reg of registrations) {
    if (consumed.has(reg.id)) continue;

    const buddy = reg.buddyRequestUserId ? byUserId.get(reg.buddyRequestUserId) : null;
    const mutual = !!buddy && !consumed.has(buddy.id) && buddy.buddyRequestUserId === reg.userId;

    if (mutual && buddy) {
      consumed.add(reg.id);
      consumed.add(buddy.id);

      const counts = { MALE: 0, FEMALE: 0, OTHER: 0 };
      counts[genderBucket(reg.gender)]++;
      counts[genderBucket(buddy.gender)]++;

      units.push({ registrationIds: [reg.id, buddy.id], genderCounts: counts });
    } else {
      consumed.add(reg.id);

      const counts = { MALE: 0, FEMALE: 0, OTHER: 0 };
      counts[genderBucket(reg.gender)]++;

      units.push({ registrationIds: [reg.id], genderCounts: counts });
    }
  }

  return units;
}

function dominantGender(unit: DrawUnit): "MALE" | "FEMALE" | "OTHER" {
  const { MALE, FEMALE, OTHER } = unit.genderCounts;
  if (MALE >= FEMALE && MALE >= OTHER) return "MALE";
  if (FEMALE >= MALE && FEMALE >= OTHER) return "FEMALE";
  return "OTHER";
}

// Greedily deals each unit to whichever team is currently smallest — among
// teams tied for smallest, the one that most needs this unit's gender (if
// balancing is on) — so team sizes stay within 1 of each other and gender
// mix stays close to proportional, while the processing order itself (and
// any genuine ties) is randomized by the seed, not hand-picked.
function dealUnits(
  units: DrawUnit[],
  numTeams: number,
  balanceGender: boolean,
  random: () => number
): string[][] {
  const teams: string[][] = Array.from({ length: numTeams }, () => []);
  const genderTallies = Array.from({ length: numTeams }, () => ({ MALE: 0, FEMALE: 0, OTHER: 0 }));

  const ordered = shuffle(units, random);

  for (const unit of ordered) {
    const gender = dominantGender(unit);

    let bestIndexes = [0];
    let bestSize = teams[0].length;

    for (let i = 1; i < numTeams; i++) {
      if (teams[i].length < bestSize) {
        bestSize = teams[i].length;
        bestIndexes = [i];
      } else if (teams[i].length === bestSize) {
        bestIndexes.push(i);
      }
    }

    let chosen = bestIndexes[0];

    if (balanceGender && bestIndexes.length > 1) {
      let fewest = genderTallies[bestIndexes[0]][gender];
      let tied = [bestIndexes[0]];

      for (const idx of bestIndexes.slice(1)) {
        const count = genderTallies[idx][gender];
        if (count < fewest) {
          fewest = count;
          tied = [idx];
        } else if (count === fewest) {
          tied.push(idx);
        }
      }

      chosen = tied[Math.floor(random() * tied.length)];
    } else if (bestIndexes.length > 1) {
      chosen = bestIndexes[Math.floor(random() * bestIndexes.length)];
    }

    teams[chosen].push(...unit.registrationIds);
    genderTallies[chosen].MALE += unit.genderCounts.MALE;
    genderTallies[chosen].FEMALE += unit.genderCounts.FEMALE;
    genderTallies[chosen].OTHER += unit.genderCounts.OTHER;
  }

  return teams;
}

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

export function runEventDraw(params: {
  registrations: DrawRegistration[];
  teamSize: number;
  matchesPerTeamCap: number;
  balanceGender: boolean;
  seed?: string;
}): DrawResult {
  const seed = params.seed ?? `${Date.now()}-${Math.random()}`;
  const random = mulberry32(seedToInt(seed));

  const units = buildDrawUnits(params.registrations);
  const totalPeople = params.registrations.length;

  const numTeams = Math.max(2, Math.round(totalPeople / Math.max(1, params.teamSize)));

  const rosters = dealUnits(units, numTeams, params.balanceGender, random);

  // Assign each formed team to a group — the group split only cares about
  // *how many* teams there are, so the team order (already randomized by the
  // deal above) is shuffled once more here purely to avoid any pattern in
  // which team lands in which group.
  const teamOrder = shuffle(
    rosters.map((registrationIds, i) => ({ registrationIds, i })),
    random
  );
  const groupNumbers = splitIntoGroups(numTeams, params.matchesPerTeamCap);
  const numGroups = new Set(groupNumbers).size;

  const teams: DrawnTeam[] = teamOrder.map(({ registrationIds }, idx) => ({
    name: `Team ${idx + 1}`,
    groupNumber: numGroups > 1 ? groupNumbers[idx] : null,
    registrationIds,
  }));

  return { seed, teams };
}
