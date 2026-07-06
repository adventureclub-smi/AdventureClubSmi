export type PortfolioTotals = {
  totalTreks: number;
  totalKm: number;
  totalNights: number;
  peaks: number;
  highestAltitude: number;
};

export type Badge = { id: string; label: string; achieved: boolean };

export function getBadges(totals: PortfolioTotals): Badge[] {
  return [
    { id: "first-summit", label: "First Summit", achieved: totals.totalTreks >= 1 },
    { id: "five-treks", label: "5+ Treks Club", achieved: totals.totalTreks >= 5 },
    { id: "hundred-km", label: "100km Club", achieved: totals.totalKm >= 100 },
    { id: "five-hundred-km", label: "500km Club", achieved: totals.totalKm >= 500 },
    { id: "peak-bagger", label: "Peak Bagger", achieved: totals.peaks >= 1 },
    {
      id: "altitude-master",
      label: "Altitude Master",
      achieved: totals.highestAltitude >= 3000,
    },
    { id: "camp-veteran", label: "Camp Veteran", achieved: totals.totalNights >= 10 },
  ];
}

export function getPortfolioPoints(totals: PortfolioTotals): number {
  return Math.round(
    totals.totalKm + totals.totalNights * 10 + totals.peaks * 50
  );
}
