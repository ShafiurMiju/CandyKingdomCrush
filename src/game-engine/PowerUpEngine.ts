/**
 * PowerUpEngine
 * -------------
 * Computes the blast area of a special candy and handles chocolate spreading.
 * It only describes WHICH cells a special affects; the {@link CascadeEngine}
 * decides how each affected cell reacts (clear candy / break ice / free lock /
 * remove chocolate) and handles chain reactions between specials.
 */

import {BOARD_COLS, BOARD_ROWS, NUM_COLORS} from '../constants';
import {Board, Position, SpecialKind} from '../types';
import {Rng, defaultRng, inBounds, isMovable, neighbors} from '../utils/grid';

/** Sentinel target colour meaning "all colours" (e.g. bomb + bomb combo). */
export const ALL_COLORS = -1;

/**
 * Returns every board position affected by activating the special at `pos`.
 * `targetColor` is only used by colour bombs (defaults to the candy under it;
 * pass {@link ALL_COLORS} to clear the whole board).
 */
export function computeBlast(
  board: Board,
  pos: Position,
  kind: SpecialKind,
  targetColor: number,
): Position[] {
  switch (kind) {
    case 'striped-h':
      return rowCells(pos.row);
    case 'striped-v':
      return columnCells(pos.col);
    case 'wrapped':
      return squareCells(pos, 1);
    case 'bomb':
      return bombCells(board, targetColor);
    default:
      return [pos];
  }
}

function rowCells(row: number): Position[] {
  const out: Position[] = [];
  for (let c = 0; c < BOARD_COLS; c++) {
    out.push({row, col: c});
  }
  return out;
}

function columnCells(col: number): Position[] {
  const out: Position[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    out.push({row: r, col});
  }
  return out;
}

/** A (2*radius+1)^2 square centred on `pos`, clipped to the board. */
function squareCells(pos: Position, radius: number): Position[] {
  const out: Position[] = [];
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (inBounds(r, c)) {
        out.push({row: r, col: c});
      }
    }
  }
  return out;
}

/** All movable candies whose colour matches the target (or all, if ALL_COLORS). */
function bombCells(board: Board, targetColor: number): Position[] {
  const out: Position[] = [];
  const all = targetColor < 0 || targetColor >= NUM_COLORS;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (isMovable(cell) && (all || cell!.color === targetColor)) {
        out.push({row: r, col: c});
      }
    }
  }
  return out;
}

/**
 * Spreads chocolate by one cell. Picks a random chocolate blocker, then a random
 * movable neighbour, and turns that neighbour into chocolate. Returns a new
 * board and the position that became chocolate (or null if it couldn't spread).
 */
export function spreadChocolate(
  board: Board,
  rng: Rng = defaultRng,
): {board: Board; spreadTo: Position | null} {
  const chocolates: Position[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c]?.chocolate) {
        chocolates.push({row: r, col: c});
      }
    }
  }
  if (chocolates.length === 0) {
    return {board, spreadTo: null};
  }

  // Try chocolates in random order until one has a movable neighbour.
  const order = [...chocolates].sort(() => rng() - 0.5);
  for (const choc of order) {
    const candidates = neighbors(choc).filter(n => isMovable(board[n.row][n.col]));
    if (candidates.length > 0) {
      const target = candidates[Math.floor(rng() * candidates.length)];
      const next = board.map(row => row.map(cell => (cell ? {...cell} : null)));
      const cell = next[target.row][target.col];
      if (cell) {
        cell.chocolate = true;
        cell.special = 'none';
        cell.locked = false;
        cell.iceLayers = 0;
      }
      return {board: next, spreadTo: target};
    }
  }
  return {board, spreadTo: null};
}
