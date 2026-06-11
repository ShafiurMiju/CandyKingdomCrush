/**
 * BoardGenerator
 * --------------
 * Builds the initial board for a level: a random fill with NO pre-existing
 * matches, then applies the level's obstacle layout (ice / locks / chocolate).
 */

import {BOARD_COLS, BOARD_ROWS, NUM_COLORS} from '../constants';
import {Board, CandyColor, Cell, LevelConfig} from '../types';
import {
  Rng,
  cloneBoard,
  defaultRng,
  emptyBoard,
  isMovable,
  makeCandy,
  makeChocolate,
  randomColor,
} from '../utils/grid';
import {hasAnyMatch} from './MatchDetector';
import {hasAvailableMove} from './SwapValidator';

/**
 * Returns true if placing `color` at (row, col) would immediately complete a
 * horizontal or vertical run of 3 with the candies already placed above/left.
 */
function createsImmediateMatch(
  board: Board,
  row: number,
  col: number,
  color: CandyColor,
): boolean {
  // Two to the left share the colour?
  if (
    col >= 2 &&
    board[row][col - 1]?.color === color &&
    board[row][col - 2]?.color === color
  ) {
    return true;
  }
  // Two above share the colour?
  if (
    row >= 2 &&
    board[row - 1][col]?.color === color &&
    board[row - 2][col]?.color === color
  ) {
    return true;
  }
  return false;
}

/** Generates a match-free random board of plain candies. */
export function generateMatchFreeBoard(rng: Rng = defaultRng): Board {
  const board = emptyBoard();
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      // Pick from a shuffled colour list so we always have a valid option even
      // if some colours are forbidden by the no-match rule.
      const order = shuffledColors(rng);
      let chosen: CandyColor = order[0];
      for (const color of order) {
        if (!createsImmediateMatch(board, r, c, color)) {
          chosen = color;
          break;
        }
      }
      board[r][c] = makeCandy(chosen);
    }
  }
  return board;
}

function shuffledColors(rng: Rng): CandyColor[] {
  const colors: CandyColor[] = [];
  for (let i = 0; i < NUM_COLORS; i++) {
    colors.push(i as CandyColor);
  }
  // Fisher-Yates
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }
  return colors;
}

/** Applies a level's obstacle layout onto a freshly generated board. */
export function applyLevelObstacles(board: Board, level: LevelConfig): Board {
  // Ice frosts an existing candy.
  for (const ice of level.ice ?? []) {
    const cell = board[ice.row]?.[ice.col];
    if (cell) {
      cell.iceLayers = ice.layers;
    }
  }
  // Locks freeze an existing candy.
  for (const lock of level.locks ?? []) {
    const cell = board[lock.row]?.[lock.col];
    if (cell) {
      cell.locked = true;
    }
  }
  // Chocolate replaces a candy with a blocker.
  for (const choc of level.chocolate ?? []) {
    if (board[choc.row]?.[choc.col] !== undefined) {
      board[choc.row][choc.col] = makeChocolate();
    }
  }
  return board;
}

/** Builds the complete starting board for a level (guaranteed to have a move). */
export function generateBoardForLevel(
  level: LevelConfig,
  rng: Rng = defaultRng,
): Board {
  const board = applyLevelObstacles(generateMatchFreeBoard(rng), level);
  // Obstacles can occasionally box the board in — make sure a move exists.
  if (!hasAvailableMove(board)) {
    return reshuffleBoard(board, rng);
  }
  return board;
}

/** Convenience: a fresh plain candy (used by gravity refill / tests). */
export function spawnCandy(color?: CandyColor, rng: Rng = defaultRng): Cell {
  return makeCandy(
    color ?? (Math.floor(rng() * NUM_COLORS) as CandyColor),
  );
}

/**
 * Re-colours the movable candies on a board until it has at least one legal move
 * and no immediate matches. Obstacles (ice / locks / chocolate) are preserved.
 * Used to rescue a "dead" board mid-game. Returns the original board if no valid
 * shuffle is found within a reasonable number of attempts.
 */
export function reshuffleBoard(board: Board, rng: Rng = defaultRng): Board {
  const positions: {row: number; col: number}[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (isMovable(board[r][c])) {
        positions.push({row: r, col: c});
      }
    }
  }
  for (let attempt = 0; attempt < 80; attempt++) {
    const next = cloneBoard(board);
    for (const p of positions) {
      const cell = next[p.row][p.col];
      if (cell) {
        cell.color = randomColor(rng);
      }
    }
    if (!hasAnyMatch(next) && hasAvailableMove(next)) {
      return next;
    }
  }
  return board;
}
