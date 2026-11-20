// Knockout-bracket generation for a Campus Event once its group stage has
// produced a ranked list of qualifiers. Uses standard tournament seeding (1
// vs 8, 4 vs 5, 2 vs 7, 3 vs 6, …) so the top seeds are kept apart for as
// long as the bracket allows — the same scheme real tournaments use, not a
// custom one-off.

export type SeededTeam = { teamId: string; seed: number };

export type BracketSlot =
  | { type: "match"; teamAId: string; teamBId: string }
  | { type: "bye"; teamId: string };

// Recursively builds the seed order for a bracket of a given (power-of-two)
// size — e.g. size 8 → [1, 8, 4, 5, 2, 7, 3, 6].
function seedOrder(size: number): number[] {
  if (size <= 1) return [1];
  const prev = seedOrder(size / 2);
  const order: number[] = [];
  for (const s of prev) {
    order.push(s, size + 1 - s);
  }
  return order;
}

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

// Round names counting down from the final — e.g. 2 rounds → ["SEMIFINAL",
// "FINAL"]; 3 rounds → ["QUARTERFINAL", "SEMIFINAL", "FINAL"].
export function roundNamesForBracketSize(bracketSize: number): string[] {
  const numRounds = Math.log2(bracketSize);
  const names: string[] = [];
  for (let roundsFromFinal = numRounds - 1; roundsFromFinal >= 0; roundsFromFinal--) {
    if (roundsFromFinal === 0) names.push("FINAL");
    else if (roundsFromFinal === 1) names.push("SEMIFINAL");
    else if (roundsFromFinal === 2) names.push("QUARTERFINAL");
    else names.push(`ROUND_OF_${2 ** (roundsFromFinal + 1)}`);
  }
  return names;
}

// qualifiers[0] must be seed 1 (the group stage's #1 finisher), and so on.
// Returns the first round's slots in bracket order — a "bye" slot already
// has its winner decided (no match to play), a "match" slot needs a result
// before the bracket can advance.
export function seedInitialBracket(qualifiers: SeededTeam[]): {
  roundName: string;
  slots: BracketSlot[];
} {
  const bracketSize = nextPowerOfTwo(qualifiers.length);
  const order = seedOrder(bracketSize);
  const bySeed = new Map(qualifiers.map((q) => [q.seed, q.teamId]));

  const slots: BracketSlot[] = [];
  for (let i = 0; i < order.length; i += 2) {
    const teamA = bySeed.get(order[i]);
    const teamB = bySeed.get(order[i + 1]);

    if (teamA && teamB) {
      slots.push({ type: "match", teamAId: teamA, teamBId: teamB });
    } else {
      // One side of this bracket slot doesn't correspond to a real
      // qualifier (only happens when qualifiersCount isn't already a power
      // of two) — whichever side is real gets a bye straight through.
      const realTeam = teamA ?? teamB;
      if (!realTeam) {
        throw new Error("Bracket slot has no real team on either side.");
      }
      slots.push({ type: "bye", teamId: realTeam });
    }
  }

  return { roundName: roundNamesForBracketSize(bracketSize)[0], slots };
}

// Every round after the first is just "pair up consecutive winners from the
// previous round, in the order those matches/byes appeared" — byes only
// ever happen once, at the very first round, since every round after that
// already has exactly a power-of-two number of teams left.
export function nextRoundPairs(previousRoundWinnersInOrder: string[]): {
  teamAId: string;
  teamBId: string;
}[] {
  const pairs: { teamAId: string; teamBId: string }[] = [];
  for (let i = 0; i < previousRoundWinnersInOrder.length; i += 2) {
    pairs.push({
      teamAId: previousRoundWinnersInOrder[i],
      teamBId: previousRoundWinnersInOrder[i + 1],
    });
  }
  return pairs;
}
