/**
 * Progress store: per-level unlock state, stars and best scores. Persisted to
 * AsyncStorage so progress survives app restarts (fully offline).
 */

import {create} from 'zustand';
import {LEVELS, TOTAL_LEVELS, nextLevelId} from '../levels';
import {StorageKeys, clearAll, loadJSON, saveJSON} from '../services/storage';
import {LevelProgress} from '../types';

export type ProgressMap = Record<number, LevelProgress>;

interface ProgressState {
  hydrated: boolean;
  levels: ProgressMap;
  hydrate: () => Promise<void>;
  recordResult: (levelId: number, stars: number, score: number) => void;
  isUnlocked: (levelId: number) => boolean;
  getProgress: (levelId: number) => LevelProgress;
  totalStars: () => number;
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
        unlocked: s.unlocked || level.id === 1,
        stars: Math.min(3, Math.max(0, s.stars ?? 0)),
        bestScore: Math.max(0, s.bestScore ?? 0),
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

  recordResult: (levelId, stars, score) => {
    const levels = {...get().levels};
    const prev = levels[levelId] ?? {unlocked: true, stars: 0, bestScore: 0};
    levels[levelId] = {
      unlocked: true,
      stars: Math.max(prev.stars, stars),
      bestScore: Math.max(prev.bestScore, score),
    };
    // Unlock the next level on any win (stars >= 1).
    if (stars >= 1) {
      const next = nextLevelId(levelId);
      if (next != null) {
        levels[next] = {
          ...(levels[next] ?? {stars: 0, bestScore: 0}),
          unlocked: true,
        };
      }
    }
    set({levels});
    void saveJSON(StorageKeys.progress, levels);
  },

  isUnlocked: levelId => get().levels[levelId]?.unlocked ?? false,

  getProgress: levelId =>
    get().levels[levelId] ?? {unlocked: levelId === 1, stars: 0, bestScore: 0},

  totalStars: () =>
    Object.values(get().levels).reduce((sum, p) => sum + p.stars, 0),

  reset: async () => {
    await clearAll();
    set({levels: defaultProgress()});
  },
}));

export const MAX_STARS = TOTAL_LEVELS * 3;
