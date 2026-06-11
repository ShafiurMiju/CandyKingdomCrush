/**
 * SwapValidator
 * -------------
 * Validates and performs candy swaps. A swap is legal when the two cells are
 * orthogonally adjacent, both movable, and either:
 *   - the swap creates at least one match, or
 *   - the swap involves a colour bomb (which always activates).
 */

import {Board, Position} from '../types';
import {areAdjacent, cloneBoard, isMovable} from '../utils/grid';
import {hasAnyMatch} from './MatchDetector';

/** Returns a new board with the candies at `a` and `b` swapped. */
export function swapCells(board: Board, a: Position, b: Position): Board {
  const next = cloneBoard(board);
  const tmp = next[a.row][a.col];
  next[a.row][a.col] = next[b.row][b.col];
  next[b.row][b.col] = tmp;
  return next;
}

/** True if both cells are movable candies sitting next to each other. */
export function isSwapAllowed(board: Board, a: Position, b: Position): boolean {
  if (!areAdjacent(a, b)) {
    return false;
  }
  return isMovable(board[a.row]?.[a.col]) && isMovable(board[b.row]?.[b.col]);
}

/** True if either of the cells is a colour bomb. */
export function involvesColorBomb(board: Board, a: Position, b: Position): boolean {
  return (
    board[a.row]?.[a.col]?.special === 'bomb' ||
    board[b.row]?.[b.col]?.special === 'bomb'
  );
}

/** True if performing the swap would create a match somewhere. */
export function wouldCreateMatch(board: Board, a: Position, b: Position): boolean {
  const swapped = swapCells(board, a, b);
  return hasAnyMatch(swapped);
}

/**
 * Full validity check used by the UI/store. A swap is valid when allowed AND
 * (it creates a match OR it involves a colour bomb).
 */
export function isValidSwap(board: Board, a: Position, b: Position): boolean {
  if (!isSwapAllowed(board, a, b)) {
    return false;
  }
  if (involvesColorBomb(board, a, b)) {
    return true;
  }
  return wouldCreateMatch(board, a, b);
}

/**
 * Returns true if the board currently has at least one legal, match-making move
 * available (used to detect / reshuffle dead boards).
 */
export function hasAvailableMove(board: Board): boolean {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      // Try swapping right and down only (covers all adjacent pairs once).
      const here: Position = {row: r, col: c};
      const right: Position = {row: r, col: c + 1};
      const down: Position = {row: r + 1, col: c};
      if (isSwapAllowed(board, here, right) && wouldCreateMatch(board, here, right)) {
        return true;
      }
      if (isSwapAllowed(board, here, down) && wouldCreateMatch(board, here, down)) {
        return true;
      }
    }
  }
  return false;
}
