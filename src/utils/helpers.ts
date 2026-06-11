/** Miscellaneous formatting / math helpers. */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Formats a score with thousands separators, e.g. 12345 -> "12,345". */
export function formatScore(score: number): string {
  return Math.round(score)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Returns a star string like "★★☆" for n out of 3. */
export function starString(n: number): string {
  const full = '★'.repeat(clamp(n, 0, 3));
  const empty = '☆'.repeat(clamp(3 - n, 0, 3));
  return full + empty;
}

/** Picks a random element from a non-empty array. */
export function pickRandom<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Promise that resolves after `ms` milliseconds. */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
