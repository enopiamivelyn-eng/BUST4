/** Normalize stored seat selections (including legacy comma-separated rows). */
export function normalizeBookedSeatNumbers(values: readonly string[] | undefined): Set<string> {
  return new Set((values ?? []).flatMap((value) => value.split(',')).map((value) => value.trim().toUpperCase()).filter(Boolean));
}

/** Keep the passenger count limit while allowing a new seat to replace the oldest selection. */
export function toggleSeatSelection(current: readonly string[], seat: string, limit: number): string[] {
  if (current.includes(seat)) return current.filter((value) => value !== seat);
  if (current.length < limit) return [...current, seat];
  return limit > 0 ? [...current.slice(1), seat] : [...current];
}
