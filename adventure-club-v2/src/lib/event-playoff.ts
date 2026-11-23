// The knockout stage for a LEAGUE_KNOCKOUT Campus Event — a fixed 4-team
// "page playoff" (the same structure as IPL cricket), not a generic
// single-elimination bracket:
//
//   Qualifier:   #1 vs #2  -> winner goes straight to the Final
//   Eliminator:  #3 vs #4  -> loser is out
//   Qualifier 2: loser(Qualifier) vs winner(Eliminator) -> winner reaches the Final
//   Final:       winner(Qualifier) vs winner(Qualifier 2)
//
// Unlike a standard bracket, the Qualifier's loser isn't eliminated — they
// get a second chance in Qualifier 2. DIRECT_KNOCKOUT events use the
// generic bracket in event-bracket.ts instead; this only ever applies to
// LEAGUE_KNOCKOUT's top 4.

export type PlayoffRound = "QUALIFIER" | "ELIMINATOR" | "QUALIFIER_2" | "FINAL";

export const PLAYOFF_ROUND_LABELS: Record<PlayoffRound, string> = {
  QUALIFIER: "Qualifier",
  ELIMINATOR: "Eliminator",
  QUALIFIER_2: "Qualifier 2",
  FINAL: "Final",
};

// The order the rounds are played in, for sorting a match list into a
// presentable sequence (e.g. on the fixtures/display pages).
export const PLAYOFF_ROUND_ORDER: PlayoffRound[] = [
  "QUALIFIER",
  "ELIMINATOR",
  "QUALIFIER_2",
  "FINAL",
];

export function seedPagePlayoff(qualifiers: [string, string, string, string]): {
  round: PlayoffRound;
  teamAId: string;
  teamBId: string;
}[] {
  const [seed1, seed2, seed3, seed4] = qualifiers;
  return [
    { round: "QUALIFIER", teamAId: seed1, teamBId: seed2 },
    { round: "ELIMINATOR", teamAId: seed3, teamBId: seed4 },
  ];
}

type PlayoffMatch = {
  round: string | null;
  teamAId: string;
  teamBId: string | null;
  winnerTeamId: string | null;
  status: string;
};

export type NextPlayoffStep =
  | { kind: "match"; round: PlayoffRound; teamAId: string; teamBId: string }
  | { kind: "waiting"; waitingOn: string }
  | { kind: "done" };

// Looks at whatever knockout matches already exist and decides what the
// next "Advance" click should do — generate Qualifier 2, generate the
// Final, or report the tournament as finished. Returns "waiting" (rather
// than throwing) when an earlier match still needs a result, so the caller
// can surface a clear message instead of a crash.
export function nextPlayoffStep(matches: PlayoffMatch[]): NextPlayoffStep {
  const byRound = (r: PlayoffRound) => matches.find((m) => m.round === r);

  const qualifier = byRound("QUALIFIER");
  const eliminator = byRound("ELIMINATOR");
  const qualifier2 = byRound("QUALIFIER_2");
  const final = byRound("FINAL");

  if (!qualifier || !eliminator) {
    return { kind: "waiting", waitingOn: "Qualifier and Eliminator haven't been generated yet." };
  }

  if (!qualifier2) {
    if (qualifier.status !== "COMPLETED" || eliminator.status !== "COMPLETED") {
      return { kind: "waiting", waitingOn: "Qualifier and Eliminator must both be completed first." };
    }

    const qualifierLoser =
      qualifier.winnerTeamId === qualifier.teamAId ? qualifier.teamBId! : qualifier.teamAId;
    const eliminatorWinner = eliminator.winnerTeamId!;

    return { kind: "match", round: "QUALIFIER_2", teamAId: qualifierLoser, teamBId: eliminatorWinner };
  }

  if (!final) {
    if (qualifier2.status !== "COMPLETED") {
      return { kind: "waiting", waitingOn: "Qualifier 2 isn't finished yet." };
    }

    return {
      kind: "match",
      round: "FINAL",
      teamAId: qualifier.winnerTeamId!,
      teamBId: qualifier2.winnerTeamId!,
    };
  }

  if (final.status !== "COMPLETED") {
    return { kind: "waiting", waitingOn: "The Final isn't finished yet." };
  }

  return { kind: "done" };
}

// Which already-generated rounds stop being valid if this round's result is
// undone — e.g. undoing the Qualifier invalidates Qualifier 2 and the Final
// (both were seeded from results downstream of it), but leaves the
// Eliminator alone since it never depended on the Qualifier. Used by the
// match-undo endpoint to delete exactly the rounds a corrected result would
// otherwise leave in an inconsistent state, and nothing more.
export function roundsInvalidatedByUndo(round: PlayoffRound): PlayoffRound[] {
  switch (round) {
    case "QUALIFIER":
    case "ELIMINATOR":
      return ["QUALIFIER_2", "FINAL"];
    case "QUALIFIER_2":
      return ["FINAL"];
    case "FINAL":
      return [];
  }
}
