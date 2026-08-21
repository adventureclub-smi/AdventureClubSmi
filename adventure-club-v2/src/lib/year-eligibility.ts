// Shared between the registration API route (server-side enforcement) and
// TrekDetails.tsx (client-side display) so the two can't drift apart.
//
// Year is free text in practice ("3rd Year" vs "3rd YEAR" both show up in
// real data — see the report route's own normalizing comment), so this
// compares case/whitespace-insensitively rather than with a strict ===.
// restrictedYears itself is always written from the fixed YEARS dropdown
// (src/lib/academic-options.ts), so only the user's side needs normalizing.
export function isYearEligible(
  userYear: string | null | undefined,
  restrictedYears: string[] | null | undefined
): boolean {
  if (!restrictedYears || restrictedYears.length === 0) return true;
  if (!userYear) return false;

  const normalized = userYear.trim().toLowerCase();
  return restrictedYears.some((year) => year.trim().toLowerCase() === normalized);
}
