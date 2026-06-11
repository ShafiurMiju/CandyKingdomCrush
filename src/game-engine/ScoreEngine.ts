/**
 * ScoreEngine
 * -----------
 * Pure scoring. Base points scale with match length; bonuses are awarded for
 * spawning/activating specials and for breaking obstacles. The whole tick is
 * then multiplied by the cascade combo multiplier.
 */

import {
  SCORE_CHOCOLATE_CLEAR,
  SCORE_EXTRA_PER_CANDY,
  SCORE_ICE_BREAK,
  SCORE_MATCH_3,
  SCORE_MATCH_4,
  SCORE_MATCH_5,
  SCORE_SPECIAL_CLEAR,
  SCORE_SPECIAL_SPAWN,
  comboMultiplier,
} from '../constants';
import {MatchRun} from '../types';

export interface ScoreParams {
  runs: MatchRun[];
  /** Number of special candies spawned this tick. */
  spawnedCount: number;
  /** Candies destroyed by special blasts beyond the base matches. */
  specialClears: number;
  /** Ice layers broken this tick. */
  iceBroken: number;
  /** Chocolate blocks cleared this tick. */
  chocoCleared: number;
  /** 1-based cascade combo index. */
  combo: number;
}

/** Base points for a single run of the given length. */
export function baseRunScore(length: number): number {
  if (length <= 3) {
    return SCORE_MATCH_3;
  }
  if (length === 4) {
    return SCORE_MATCH_4;
  }
  if (length === 5) {
    return SCORE_MATCH_5;
  }
  return SCORE_MATCH_5 + (length - 5) * SCORE_EXTRA_PER_CANDY;
}

/** Computes the (combo-multiplied) score earned in a single cascade tick. */
export function computeScore(params: ScoreParams): number {
  let subtotal = 0;
  for (const run of params.runs) {
    subtotal += baseRunScore(run.length);
  }
  subtotal += params.spawnedCount * SCORE_SPECIAL_SPAWN;
  subtotal += params.specialClears * SCORE_SPECIAL_CLEAR;
  subtotal += params.iceBroken * SCORE_ICE_BREAK;
  subtotal += params.chocoCleared * SCORE_CHOCOLATE_CLEAR;
  return Math.round(subtotal * comboMultiplier(params.combo));
}
