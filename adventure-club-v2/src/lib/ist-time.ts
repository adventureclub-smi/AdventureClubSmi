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
