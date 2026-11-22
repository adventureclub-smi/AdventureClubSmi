// Maps the admin's free-text team colour ("Red", "Sky Blue") to a real hex
// value for swatches — admins type a colour name, not a hex code, so this
// is best-effort rather than a strict enum. Anything unrecognised still
// renders (as a neutral dot) rather than breaking.
const NAMED_COLOURS: Record<string, string> = {
  red: "#e53935",
  blue: "#1e88e5",
  "sky blue": "#29b6f6",
  "navy blue": "#1a237e",
  green: "#43a047",
  yellow: "#fdd835",
  orange: "#fb8c00",
  purple: "#8e24aa",
  pink: "#ec407a",
  black: "#212121",
  white: "#f5f5f5",
  grey: "#757575",
  gray: "#757575",
  maroon: "#7b1123",
  teal: "#00897b",
  gold: "#c9a227",
  silver: "#b0bec5",
  brown: "#6d4c41",
  cyan: "#00acc1",
  magenta: "#d81b60",
  lime: "#c0ca33",
  indigo: "#3949ab",
};

export function colourToHex(colour: string): string {
  return NAMED_COLOURS[colour.trim().toLowerCase()] || "#9e9e9e";
}
