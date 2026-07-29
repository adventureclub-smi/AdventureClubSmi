// Archived seasons that have historical data imported. Add the next
// season here once its treks are backfilled.
export const HISTORICAL_SEASONS = ["2025-26"];

// The club's season runs July-June (treks cluster in July at the start of
// each academic year), so "this year" straddles a calendar-year boundary —
// e.g. today being anywhere in Jul 2026-Jun 2027 all reads as "2026-27".
export function getCurrentSeasonLabel(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed; June = 5, July = 6
  const startYear = month >= 6 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");

  return `${startYear}-${endYearShort}`;
}
