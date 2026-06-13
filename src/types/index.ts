/**
 * Core domain types shared across the game engine, store and UI.
 *
 * The board is a 2D array indexed as `board[row][col]`, row 0 at the TOP.
 * A cell is either a {@link Cell} or `null` (a transient empty hole that exists
 * only between a clear and the following gravity/refill step).
 */

/** Candy colour, 0..5 (six candy types). */
export type CandyColor = 0 | 1 | 2 | 3 | 4 | 5;

/** Number of distinct candy colours on the board. */
export const CANDY_COLOR_COUNT = 6;

/**
 * Special candy kinds. Produced by matches of 4+, L/T shapes and 5-in-a-row.
 * - `striped-h` clears its entire ROW when activated.
 * - `striped-v` clears its entire COLUMN when activated.
 * - `wrapped`   explodes the surrounding 3x3 area (twice).
 * - `bomb`      colour bomb: clears every candy of a chosen colour.
 */
export type SpecialKind =
  | 'none'
  | 'striped-h'
  | 'striped-v'
  | 'wrapped'
  | 'bomb';

/** A single board cell holding a candy plus any obstacle state. */
export interface Cell {
  /** Stable unique id used by the UI to track a candy across moves/animations. */
  id: number;
  /** Candy colour. Meaningless for chocolate blockers (kept for layout). */
  color: CandyColor;
  /** Special candy kind, or 'none' for a plain candy. */
  special: SpecialKind;
  /**
   * Frosting layers covering this CELL coordinate (0 = none). The candy on top
   * matches/moves normally; each match that clears a candy here decrements the
   * frost by one. The objective "clear all ice" means reduce every layer to 0.
   */
  iceLayers: number;
  /** A locked candy cannot be swapped or matched until freed by a nearby match. */
  locked: boolean;
  /** When true, this cell is a chocolate blocker: a solid square, no movable candy. */
  chocolate: boolean;
}

/** A board cell or an empty hole. */
export type BoardCell = Cell | null;

/** The match-3 board: `board[row][col]`. */
export type Board = BoardCell[][];

/** A grid coordinate. */
export interface Position {
  row: number;
  col: number;
}

/** A run of 3+ same-colour candies found by the {@link MatchDetector}. */
export interface MatchRun {
  cells: Position[];
  orientation: 'horizontal' | 'vertical';
  color: CandyColor;
  length: number;
}

/** The full result of scanning a board for matches. */
export interface MatchResult {
  /** All distinct cells that participate in at least one run. */
  matchedCells: Position[];
  /** Individual runs (used to decide which special candies to spawn). */
  runs: MatchRun[];
  /** Special candies that should spawn as a result of these matches. */
  spawns: SpecialSpawn[];
}

/** Describes a special candy that should be created at a position. */
export interface SpecialSpawn {
  position: Position;
  kind: SpecialKind;
  color: CandyColor;
}

/** A swap of two adjacent cells. */
export interface Swap {
  from: Position;
  to: Position;
}

/** Everything that happened during a single cascade tick. */
export interface ClearEvent {
  /** Candies removed from the board this tick. */
  cleared: Position[];
  /** Ice coordinates whose frost was decremented this tick. */
  iceBroken: Position[];
  /** Locked candies freed by an adjacent clear this tick. */
  locksFreed: Position[];
  /** Chocolate blockers removed this tick. */
  chocolateCleared: Position[];
  /** Special candies spawned this tick. */
  spawned: SpecialSpawn[];
  /** Special candies that detonated this tick (for explosion FX). */
  detonated: Position[];
  /** Points earned this tick (already multiplied by the combo). */
  scoreGained: number;
  /** Size of the largest contributing match this tick. */
  largestMatch: number;
}

/** One step of a cascade: the board state before/after gravity plus its event. */
export interface CascadeStep {
  /** Board with cleared cells set to null, BEFORE gravity. */
  boardAfterClear: Board;
  /** Board after gravity + refill. */
  boardAfterGravity: Board;
  /** What happened this step. */
  event: ClearEvent;
  /** 1-based cascade index (the combo multiplier driver). */
  combo: number;
}

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

/** Win objective for a level. */
export type ObjectiveType = 'score' | 'clear-ice' | 'clear-chocolate';

/**
 * How a level is bounded:
 *  - 'moves' : a fixed swap budget; play to the last move (stars by score %).
 *  - 'time'  : a countdown timer instead of moves (stars by % completed).
 */
export type LevelMode = 'moves' | 'time';

/** Placement of a frosted (ice) cell at level start. */
export interface IcePlacement {
  row: number;
  col: number;
  layers: number;
}

/** Placement of a locked candy at level start. */
export interface LockPlacement {
  row: number;
  col: number;
}

/** Placement of a chocolate blocker at level start. */
export interface ChocolatePlacement {
  row: number;
  col: number;
}

/** A single handcrafted level configuration. */
export interface LevelConfig {
  id: number;
  name: string;
  /** Primary objective; "score" also gates on reaching {@link targetScore}. */
  objective: ObjectiveType;
  /** 100% mark for star rating; score levels reach it for 2★. */
  targetScore: number;
  /** Maximum number of swaps allowed (move levels). Ignored for time levels. */
  moves: number;
  /** Bounding mode. Defaults to 'moves' when omitted. */
  mode?: LevelMode;
  /** Countdown length in seconds (required for `mode: 'time'`). */
  timeLimitSec?: number;
  /** Total stars (across all levels) needed before this level unlocks. */
  requiredStars?: number;
  ice?: IcePlacement[];
  locks?: LockPlacement[];
  chocolate?: ChocolatePlacement[];
  /** Short blurb shown on the level card. */
  description: string;
}

/** Per-level saved progress. */
export interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0..3 (the visible rating)
  bestScore: number;
  /** The separate "bonus star" — mastery reward, currency for unlocking gates. */
  bonusStar: boolean;
}

/** The outcome of a finished level. */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost';
