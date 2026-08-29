// `<input type="datetime-local">` values (e.g. "2026-07-15T10:00") carry no
// timezone info. Every admin using this form is in India, so the value is
// always intended as IST wall-clock time — appending a fixed +05:30 offset
// makes the parse unambiguous. Without this, `new Date(value)` uses whatever
// timezone the server process happens to run in (IST in local dev, UTC on
// Vercel), which silently shifted every saved time by 5.5 hours in production.
export function parseIstDateTimeLocal(value?: string | null): Date | null {
  if (!value) return null;
  return new Date(`${value}:00+05:30`);
}

// The inverse of parseIstDateTimeLocal, for repopulating a `datetime-local`
// input from a value fetched back from the API. A stored Date is an absolute
// instant with no timezone attached, so naively slicing its ISO string
// (`isoString.slice(0, 16)`) reads off UTC digits — every saved time then
// displayed 5.5 hours off from what was actually set, changing again on
// every reload since re-saving that wrong value drifts it further. This
// renders the instant AS India time explicitly (not the browser's own local
// timezone) via Intl, so it's correct regardless of what timezone the
// admin's own machine happens to be set to.
export function formatIstDateTimeLocal(value?: string | Date | null): string {
  if (!value) return "";

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
