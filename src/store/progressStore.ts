/**
 * Progress store: per-level unlock state, stars and best scores. Persisted to
 * AsyncStorage so progress survives app restarts (fully offline).
 */

import {create} from 'zustand';
import {STARS_PER_LEVEL} from '../constants';
import {LEVELS, TOTAL_LEVELS, getLevel, nextLevelId} from '../levels';
import {StorageKeys, clearAll, loadJSON, saveJSON} from '../services/storage';
import {LevelProgress} from '../types';

export type ProgressMap = Record<number, LevelProgress>;

interface ProgressState {
  hydrated: boolean;
  levels: ProgressMap;
  hydrate: () => Promise<void>;
  recordResult: (
    levelId: number,
    stars: number,
    score: number,
    bonusStar: boolean,
  ) => void;
  isUnlocked: (levelId: number) => boolean;
  getProgress: (levelId: number) => LevelProgress;
  totalStars: () => number;
  /** Total bonus stars collected — the currency that opens star-gated levels. */
  totalBonusStars: () => number;
  reset: () => Promise<void>;
}

/** Fresh progress: only level 1 unlocked. */
function defaultProgress(): ProgressMap {
  const map: ProgressMap = {};
  for (const level of LEVELS) {
    map[level.id] = {
      unlocked: level.id === 1,
      stars: 0,
      bestScore: 0,
      bonusStar: false,
    };
  }
  return map;
}

/** Merges saved data over defaults so new levels added later stay valid. */
function mergeProgress(saved: ProgressMap | null): ProgressMap {
  const base = defaultProgress();
  if (!saved) {
    return base;
  }
  for (const level of LEVELS) {
    const s = saved[level.id];
    if (s) {
      base[level.id] = {
        // Treat a missing `unlocked` (older saves) as already unlocked so we
        // never re-lock earned progress; only an explicit false re-locks.
        unlocked: s.unlocked !== false || level.id === 1,
        stars: Math.min(STARS_PER_LEVEL, Math.max(0, s.stars ?? 0)),
        bestScore: Math.max(0, s.bestScore ?? 0),
        bonusStar: !!s.bonusStar,
      };
    }
  }
  return base;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  hydrated: false,
  levels: defaultProgress(),

  hydrate: async () => {
    const saved = await loadJSON<ProgressMap | null>(StorageKeys.progress, null);
    set({levels: mergeProgress(saved), hydrated: true});
  },

  recordResult: (levelId, stars, score, bonusStar) => {
    const levels = {...get().levels};
    const prev = levels[levelId] ?? {
      unlocked: true,
      stars: 0,
      bestScore: 0,
      bonusStar: false,
    };
    levels[levelId] = {
      unlocked: true,
      stars: Math.max(prev.stars, stars),
      bestScore: Math.max(prev.bestScore, score),
      bonusStar: prev.bonusStar || bonusStar,
    };
    // Unlock the next level on any win (stars >= 1).
    if (stars >= 1) {
      const next = nextLevelId(levelId);
      if (next != null) {
        levels[next] = {
          ...(levels[next] ?? {stars: 0, bestScore: 0, bonusStar: false}),
          unlocked: true,
        };
      }
    }
    set({levels});
    void saveJSON(StorageKeys.progress, levels);
  },

  // A level is playable once it has been sequentially reached AND the player
  // has collected enough BONUS stars to clear its gate (requiredStars).
  isUnlocked: levelId => {
    const stored = get().levels[levelId]?.unlocked ?? levelId === 1;
    if (!stored) {
      return false;
    }
    const required = getLevel(levelId)?.requiredStars ?? 0;
    return get().totalBonusStars() >= required;
  },

  getProgress: levelId =>
    get().levels[levelId] ?? {
      unlocked: levelId === 1,
      stars: 0,
      bestScore: 0,
      bonusStar: false,
    },

  totalStars: () =>
    Object.values(get().levels).reduce((sum, p) => sum + p.stars, 0),

  totalBonusStars: () =>
    Object.values(get().levels).reduce((sum, p) => sum + (p.bonusStar ? 1 : 0), 0),

  reset: async () => {
    await clearAll();
    set({levels: defaultProgress()});
  },
}));

/** Maximum collectible regular stars (3 per level). */
export const MAX_STARS = TOTAL_LEVELS * STARS_PER_LEVEL;
/** Maximum collectible bonus stars (1 per level) — the unlock currency. */
export const MAX_BONUS_STARS = TOTAL_LEVELS;
