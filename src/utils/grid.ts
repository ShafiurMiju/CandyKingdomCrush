/**
 * Low-level board/grid helpers used throughout the game engine.
 * Pure functions only — no React, no side effects beyond the id counter.
 */

import {BOARD_COLS, BOARD_ROWS, NUM_COLORS} from '../constants';
import {Board, BoardCell, Cell, CandyColor, Position, SpecialKind} from '../types';

/** A random number generator returning a float in [0, 1). */
export type Rng = () => number;

/** Default RNG. Math.random is fine in the app runtime. */
export const defaultRng: Rng = Math.random;

// --- Stable id generation for animation tracking ---------------------------
let _nextId = 1;

/** Returns a process-unique id for a new candy. */
export function nextCellId(): number {
  return _nextId++;
}

/** Resets the id counter. Useful in tests for deterministic ids. */
export function resetCellIds(start = 1): void {
  _nextId = start;
}

// --- Construction ----------------------------------------------------------

/** Creates a fresh plain candy cell of the given colour. */
export function makeCandy(color: CandyColor): Cell {
  return {
    id: nextCellId(),
    color,
    special: 'none',
    iceLayers: 0,
    locked: false,
    chocolate: false,
  };
}

/** Creates a special candy of the given kind and colour. */
export function makeSpecial(kind: SpecialKind, color: CandyColor): Cell {
  return {
    id: nextCellId(),
    color,
    special: kind,
    iceLayers: 0,
    locked: false,
    chocolate: false,
  };
}

/** Creates a chocolate blocker cell. */
export function makeChocolate(): Cell {
  return {
    id: nextCellId(),
    color: 0,
    special: 'none',
    iceLayers: 0,
    locked: false,
    chocolate: true,
  };
}

/** Picks a random candy colour in [0, NUM_COLORS). */
export function randomColor(rng: Rng = defaultRng): CandyColor {
  return Math.floor(rng() * NUM_COLORS) as CandyColor;
}

// --- Geometry --------------------------------------------------------------

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function areAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
}

/** Orthogonal in-bounds neighbours of a position. */
export function neighbors(pos: Position): Position[] {
  const deltas = [
    {row: -1, col: 0},
    {row: 1, col: 0},
    {row: 0, col: -1},
    {row: 0, col: 1},
  ];
  const out: Position[] = [];
  for (const d of deltas) {
    const r = pos.row + d.row;
    const c = pos.col + d.col;
    if (inBounds(r, c)) {
      out.push({row: r, col: c});
    }
  }
  return out;
}

// --- Cell predicates -------------------------------------------------------

/**
 * "Solid" cells don't fall and block candies above them from falling through.
 * Locked candies, chocolate blockers and still-frosted (iced) candies are solid.
 * Keeping ice solid means its state can safely live on the cell: the candy never
 * moves while frosted, so the frost never "travels" during gravity.
 */
export function isSolid(cell: BoardCell): boolean {
  return !!cell && (cell.locked || cell.chocolate || cell.iceLayers > 0);
}

/** A movable candy can fall and be swapped. */
export function isMovable(cell: BoardCell): boolean {
  return (
    !!cell && !cell.locked && !cell.chocolate && cell.iceLayers === 0
  );
}

/** A candy that can participate in colour matching. */
export function isMatchable(cell: BoardCell): boolean {
  return (
    !!cell && !cell.locked && !cell.chocolate && cell.iceLayers === 0
  );
}

// --- Board cloning ----------------------------------------------------------

/** Deep-ish clone of the board (new arrays + shallow-copied cells). */
export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? {...cell} : null)));
}

/** Returns a new board with the cell at (row,col) replaced. */
export function setCell(
  board: Board,
  row: number,
  col: number,
  cell: BoardCell,
): Board {
  const next = cloneBoard(board);
  next[row][col] = cell;
  return next;
}

/** Builds an empty ROWSxCOLS board filled with null. */
export function emptyBoard(): Board {
  const board: Board = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
}

/** Iterates every position on the board top-to-bottom, left-to-right. */
export function forEachCell(
  board: Board,
  fn: (cell: BoardCell, row: number, col: number) => void,
): void {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      fn(board[r][c], r, c);
    }
  }
}
