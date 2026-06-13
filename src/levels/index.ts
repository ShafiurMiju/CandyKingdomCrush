/**
 * Level catalogue. The 20 handcrafted levels live in `levels.json` (so they can
 * be edited as plain data) and are typed + indexed here.
 */

import {LevelConfig} from '../types';
import rawLevels from './levels.json';

export const LEVELS: LevelConfig[] = (rawLevels as LevelConfig[]).map(level => {
  // Fail fast on a misconfigured time level: without a positive timeLimitSec
  // the countdown would start at 0 and the level would be unwinnable.
  if (level.mode === 'time' && !(level.timeLimitSec && level.timeLimitSec > 0)) {
    throw new Error(
      `Level ${level.id} ("${level.name}") has mode:'time' but no positive timeLimitSec`,
    );
  }
  return level;
});

export const TOTAL_LEVELS = LEVELS.length;

/** Returns the level with the given id (1-based), or undefined. */
export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}

/** Returns the next level id, or null if `id` is the last level. */
export function nextLevelId(id: number): number | null {
  const idx = LEVELS.findIndex(l => l.id === id);
  if (idx === -1 || idx + 1 >= LEVELS.length) {
    return null;
  }
  return LEVELS[idx + 1].id;
}
