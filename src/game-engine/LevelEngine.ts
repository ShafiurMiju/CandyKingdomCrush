/**
 * LevelEngine
 * -----------
 * Level objectives, win/lose evaluation and star ratings. Pure helpers that read
 * the current board + score and the level config.
 */

import {
  BONUS_STAR_MOVE_RATIO,
  BOARD_COLS,
  BOARD_ROWS,
  MOVE_STAR_RATIOS,
  TIME_STAR_RATIOS,
} from '../constants';
import {Board, LevelConfig} from '../types';

/** True for time-based (countdown) levels; false for move-budget levels. */
export function isTimedLevel(level: LevelConfig): boolean {
  return level.mode === 'time';
}

/** Total remaining ice layers on the board. */
export function countIceLayers(board: Board): number {
  let total = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      total += board[r][c]?.iceLayers ?? 0;
    }
  }
  return total;
}

/** Number of chocolate blockers on the board. */
export function countChocolate(board: Board): number {
  let total = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c]?.chocolate) {
        total += 1;
      }
    }
  }
  return total;
}

/** Number of still-locked candies on the board. */
export function countLocks(board: Board): number {
  let total = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c]?.locked) {
        total += 1;
      }
    }
  }
  return total;
}

/**
 * Visible stars (0..3) for a MOVE/score level: the FINAL score (after the
 * leftover-move auto-play bonus) as a multiple of target via
 * {@link MOVE_STAR_RATIOS} — 1.0 = just reaching target = 1★.
 */
export function starsForScore(finalScore: number, targetScore: number): number {
  if (targetScore <= 0) {
    return 0;
  }
  const ratio = finalScore / targetScore;
  if (ratio >= MOVE_STAR_RATIOS[2]) {
    return 3;
  }
  if (ratio >= MOVE_STAR_RATIOS[1]) {
    return 2;
  }
  if (ratio >= MOVE_STAR_RATIOS[0]) {
    return 1;
  }
  return 0;
}

/** True if a move-level final score earns the separate bonus star. */
export function bonusStarForScore(
  finalScore: number,
  targetScore: number,
): boolean {
  return targetScore > 0 && finalScore >= targetScore * BONUS_STAR_MOVE_RATIO;
}

/**
 * Visible stars (0..3) for a TIME level. `completed` (objective met before time
 * ran out) is the full 3★. Otherwise the fraction completed at timeout decides
 * 1★/2★ via {@link TIME_STAR_RATIOS} (below 50% = 0, a fail).
 */
export function starsForTime(
  completed: boolean,
  completionFrac: number,
): number {
  if (completed) {
    return 3;
  }
  if (completionFrac >= TIME_STAR_RATIOS[1]) {
    return 2;
  }
  if (completionFrac >= TIME_STAR_RATIOS[0]) {
    return 1;
  }
  return 0;
}

/** True if a time level earns the bonus star: completed within half the time. */
export function bonusStarForTime(
  completed: boolean,
  timeUsedMs: number,
  timeLimitMs: number,
): boolean {
  return completed && timeLimitMs > 0 && timeUsedMs <= timeLimitMs / 2;
}

/** True once the level's win objective has been satisfied. */
export function isObjectiveComplete(
  level: LevelConfig,
  board: Board,
  score: number,
): boolean {
  switch (level.objective) {
    case 'clear-ice':
      // Clear every frosting AND reach the target score.
      return countIceLayers(board) === 0 && score >= level.targetScore;
    case 'clear-chocolate':
      return countChocolate(board) === 0 && score >= level.targetScore;
    case 'score':
    default:
      return score >= level.targetScore;
  }
}

export interface ObjectiveProgress {
  label: string;
  current: number;
  target: number;
  complete: boolean;
}

/** Human-readable objective progress for the HUD. */
export function objectiveProgress(
  level: LevelConfig,
  board: Board,
  score: number,
): ObjectiveProgress {
  switch (level.objective) {
    case 'clear-ice': {
      const total = totalIcePlacements(level);
      const remaining = countIceLayers(board);
      return {
        label: 'Break the ice',
        current: total - remaining,
        target: total,
        // Mirrors isObjectiveComplete: the obstacle AND the score gate.
        complete: remaining === 0 && score >= level.targetScore,
      };
    }
    case 'clear-chocolate': {
      const total = (level.chocolate ?? []).length;
      const remaining = countChocolate(board);
      return {
        label: 'Clear the chocolate',
        current: Math.max(0, total - remaining),
        target: total,
        complete: remaining === 0 && score >= level.targetScore,
      };
    }
    case 'score':
    default:
      return {
        label: 'Reach the target score',
        current: Math.min(score, level.targetScore),
        target: level.targetScore,
        complete: score >= level.targetScore,
      };
  }
}

function totalIcePlacements(level: LevelConfig): number {
  return (level.ice ?? []).reduce((sum, i) => sum + i.layers, 0);
}

/** Fraction (0..1) of the objective completed — used for time-level stars. */
export function completionRatio(
  level: LevelConfig,
  board: Board,
  score: number,
): number {
  const p = objectiveProgress(level, board, score);
  return p.target > 0 ? Math.min(1, p.current / p.target) : 0;
}

/** Context the evaluator needs about the two bounding modes. */
export interface EvalContext {
  /** Swaps remaining (move levels). */
  movesLeft: number;
  /** Milliseconds remaining (time levels). */
  timeLeftMs?: number;
  /** The level's full time budget in ms (time levels). */
  timeLimitMs?: number;
}

export interface LevelResult {
  status: 'won' | 'lost' | 'playing';
  /** Visible 0..3 rating (meaningful once decided). */
  stars: number;
  /** The separate bonus star (mastery reward / unlock currency). */
  bonusStar: boolean;
  finalScore: number;
}

/**
 * Evaluates the level after a move (move levels) or a timer tick (time levels).
 *
 *  - Move levels: FINISH-AT-TARGET — win the instant the objective is met
 *    (score≥target; obstacles cleared+target). Leftover moves are auto-played
 *    by the caller, which then re-evaluates with the boosted final score. Stars
 *    come from `starsForScore`; the bonus star from `bonusStarForScore`. A loss
 *    only happens when moves run out before the objective is met.
 *  - Time levels: win on completing the objective (3★; bonus star within half
 *    the time). At timeout, partial completion grants 1★/2★, else a loss.
 */
export function evaluateLevel(
  level: LevelConfig,
  board: Board,
  score: number,
  ctx: EvalContext,
): LevelResult {
  if (isTimedLevel(level)) {
    const timeLimitMs = ctx.timeLimitMs ?? 0;
    const timeLeftMs = ctx.timeLeftMs ?? 0;
    const timeUsedMs = Math.max(0, timeLimitMs - timeLeftMs);
    if (isObjectiveComplete(level, board, score)) {
      return {
        status: 'won',
        stars: starsForTime(true, 1),
        bonusStar: bonusStarForTime(true, timeUsedMs, timeLimitMs),
        finalScore: score,
      };
    }
    if (timeLeftMs <= 0) {
      const stars = starsForTime(false, completionRatio(level, board, score));
      return {
        status: stars >= 1 ? 'won' : 'lost',
        stars,
        bonusStar: false,
        finalScore: score,
      };
    }
    return {status: 'playing', stars: 0, bonusStar: false, finalScore: score};
  }

  // Move-budget levels — finish-at-target.
  if (isObjectiveComplete(level, board, score)) {
    return {
      status: 'won',
      stars: Math.max(1, starsForScore(score, level.targetScore)),
      bonusStar: bonusStarForScore(score, level.targetScore),
      finalScore: score,
    };
  }
  if (ctx.movesLeft <= 0) {
    return {status: 'lost', stars: 0, bonusStar: false, finalScore: score};
  }
  return {status: 'playing', stars: 0, bonusStar: false, finalScore: score};
}
