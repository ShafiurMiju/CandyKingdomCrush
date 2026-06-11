/**
 * LevelEngine
 * -----------
 * Level objectives, win/lose evaluation and star ratings. Pure helpers that read
 * the current board + score and the level config.
 */

import {BOARD_COLS, BOARD_ROWS} from '../constants';
import {Board, LevelConfig} from '../types';

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

/** Stars earned for a score against the level thresholds (0..3). */
export function computeStars(
  score: number,
  thresholds: [number, number, number],
): number {
  if (score >= thresholds[2]) {
    return 3;
  }
  if (score >= thresholds[1]) {
    return 2;
  }
  if (score >= thresholds[0]) {
    return 1;
  }
  return 0;
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
        complete: remaining === 0,
      };
    }
    case 'clear-chocolate': {
      const total = (level.chocolate ?? []).length;
      const remaining = countChocolate(board);
      return {
        label: 'Clear the chocolate',
        current: Math.max(0, total - remaining),
        target: total,
        complete: remaining === 0,
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

/**
 * Evaluates the level after a move. Returns 'won', 'lost' or 'playing'.
 * Stars are only meaningful when the result is 'won'.
 */
export function evaluateLevel(
  level: LevelConfig,
  board: Board,
  score: number,
  movesLeft: number,
): {status: 'won' | 'lost' | 'playing'; stars: number} {
  if (isObjectiveComplete(level, board, score)) {
    return {
      status: 'won',
      stars: Math.max(1, computeStars(score, level.starThresholds)),
    };
  }
  if (movesLeft <= 0) {
    return {status: 'lost', stars: 0};
  }
  return {status: 'playing', stars: 0};
}
