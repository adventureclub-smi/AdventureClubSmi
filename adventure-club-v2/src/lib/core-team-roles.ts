// Pure club-role classification — no server-only imports, safe to use from
// both client and server code (unlike core-team.ts, which pulls in
// next/headers via getCurrentUser and can't be imported from a client
// component).

// The five positions that already carry full operational admin access.
// "Admin" is senior to all of them (the election's fixed organizer role).
export const ELEVATED_CLUB_ROLES = new Set([
  "Admin",
  "President",
  "Treasurer",
  "Event Head",
  "Logistics Head",
]);

// Club roles that are attendance tiers, not team positions — never core team.
export const NON_CORE_CLUB_ROLES = new Set(["Member", "Participant"]);

// Every other position: real team roles that aren't already elevated.
export const PLAIN_CORE_CLUB_ROLES = new Set([
  "Guides",
  "Logistics Team",
  "Event Team",
  "Visual Team Head",
  "Visual Team",
  "Marketing Head",
  "Web & Tech Team",
]);

// Default electable positions for a new election — every real position
// except the fixed "Admin" organizer role.
export const ELECTABLE_POSITIONS = [
  "President",
  "Treasurer",
  "Guides",
  "Logistics Head",
  "Logistics Team",
  "Event Head",
  "Event Team",
  "Visual Team Head",
  "Visual Team",
  "Marketing Head",
  "Web & Tech Team",
];

export function clubRoleBucket(clubRole: string): "ELEVATED" | "CORE" | "NONE" {
  if (ELEVATED_CLUB_ROLES.has(clubRole)) return "ELEVATED";
  if (NON_CORE_CLUB_ROLES.has(clubRole)) return "NONE";
  return "CORE";
}

// True for anyone eligible to vote in a Core Team Restructure election —
// every club role except Member/Participant. "Admin" itself is excluded
// separately (the organizer doesn't vote), checked at the call site.
export function isCoreTeamRole(clubRole: string): boolean {
  return clubRoleBucket(clubRole) !== "NONE";
}
