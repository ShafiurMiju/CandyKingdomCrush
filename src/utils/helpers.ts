/** Miscellaneous formatting / math helpers. */

import {STARS_PER_LEVEL} from '../constants';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Formats a score with thousands separators, e.g. 12345 -> "12,345". */
export function formatScore(score: number): string {
  return Math.round(score)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Formats a millisecond duration as m:ss, e.g. 75000 -> "1:15". */
export function formatSeconds(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Returns a star string like "★★☆☆" for n out of max. */
export function starString(n: number, max: number = STARS_PER_LEVEL): string {
  const full = '★'.repeat(clamp(n, 0, max));
  const empty = '☆'.repeat(clamp(max - n, 0, max));
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
