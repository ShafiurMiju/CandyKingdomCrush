/**
 * GravityEngine
 * -------------
 * Segment-based gravity + refill. Solid cells (locked / chocolate / iced) act as
 * floors: movable candies fall to the bottom of the segment beneath them, and
 * new candies spawn from the top into the topmost (sky-facing) segment only.
 */

import {BOARD_COLS, BOARD_ROWS} from '../constants';
import {Board} from '../types';
import {Rng, cloneBoard, defaultRng, isSolid, makeCandy, randomColor} from '../utils/grid';

/**
 * Applies gravity: every movable candy falls straight down until it rests on the
 * floor, another candy, or a solid cell. Returns a NEW board.
 */
export function applyGravity(board: Board): Board {
  const next = cloneBoard(board);
  for (let c = 0; c < BOARD_COLS; c++) {
    let write = BOARD_ROWS - 1;
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      const cell = next[r][c];
      if (isSolid(cell)) {
        // Solid stays put; the next writable slot is directly above it.
        write = r - 1;
        continue;
      }
      if (cell !== null) {
        if (write !== r) {
          next[write][c] = cell;
          next[r][c] = null;
        }
        write--;
      }
      // null cells are skipped, leaving the gap to be filled by refill().
    }
  }
  return next;
}

/**
 * Refills empty cells by spawning new candies from the top. Spawning stops at
 * the first solid cell in a column (candy generators can't reach past blockers).
 */
export function refill(board: Board, rng: Rng = defaultRng): Board {
  const next = cloneBoard(board);
  for (let c = 0; c < BOARD_COLS; c++) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      const cell = next[r][c];
      if (isSolid(cell)) {
        break;
      }
      if (cell === null) {
        next[r][c] = makeCandy(randomColor(rng));
      }
    }
  }
  return next;
}

/** Convenience: gravity followed by refill in one call. */
export function applyGravityAndRefill(board: Board, rng: Rng = defaultRng): Board {
  return refill(applyGravity(board), rng);
}

/** True if any column currently has a floating gap (a null beneath a candy). */
export function hasFloatingCandies(board: Board): boolean {
  for (let c = 0; c < BOARD_COLS; c++) {
    let sawEmpty = false;
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      const cell = board[r][c];
      if (isSolid(cell)) {
        sawEmpty = false;
        continue;
      }
      if (cell === null) {
        sawEmpty = true;
      } else if (sawEmpty) {
        return true;
      }
    }
  }
  return false;
}
