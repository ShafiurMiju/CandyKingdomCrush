/**
 * CascadeEngine
 * -------------
 * The orchestrator. Given a board (already swapped by the caller) it repeatedly:
 *   1. finds matches + forced special activations,
 *   2. expands the clear set through chained special-candy blasts,
 *   3. spawns new special candies, breaks ice, frees locks, clears chocolate,
 *   4. applies gravity + refill,
 * recording each pass as a {@link CascadeStep} until the board is stable.
 *
 * Every function is pure: inputs are never mutated, new boards are returned.
 */

import {
  Board,
  CascadeStep,
  ClearEvent,
  Position,
  SpecialSpawn,
} from '../types';
import {
  Rng,
  cloneBoard,
  defaultRng,
  isSolid,
  makeSpecial,
  neighbors,
} from '../utils/grid';
import {applyGravityAndRefill} from './GravityEngine';
import {findMatches} from './MatchDetector';
import {computeBlast} from './PowerUpEngine';
import {computeScore} from './ScoreEngine';

const key = (p: Position) => `${p.row},${p.col}`;

export interface ClearOptions {
  /** Positions of special candies to detonate even without a colour match. */
  forcedActivations?: Position[];
  /** Per-position bomb target colours (keyed by `${row},${col}`). */
  bombTargetColors?: Map<string, number>;
  /** 1-based combo index for scoring. */
  combo: number;
}

export interface ClearResult {
  /** Board after clearing/spawning, BEFORE gravity. */
  boardAfterClear: Board;
  event: ClearEvent;
}

/**
 * Performs a single clear pass (no gravity). Returns null when there is nothing
 * to clear or activate.
 */
export function computeClear(
  board: Board,
  options: ClearOptions,
): ClearResult | null {
  const matchResult = findMatches(board);
  const forced = options.forcedActivations ?? [];

  if (matchResult.matchedCells.length === 0 && forced.length === 0) {
    return null;
  }

  const next = cloneBoard(board);

  const clearSet = new Map<string, Position>(); // movable candies to remove
  const iceHits = new Map<string, Position>();
  const lockFrees = new Map<string, Position>();
  const chocoClears = new Map<string, Position>();
  const activated = new Set<string>();
  const detonated: Position[] = [];
  const queue: Position[] = [];

  // Seed with matched cells and any specials caught in those matches.
  for (const p of matchResult.matchedCells) {
    clearSet.set(key(p), p);
  }
  for (const p of matchResult.matchedCells) {
    const cell = board[p.row][p.col];
    if (cell && cell.special !== 'none') {
      queue.push(p);
    }
  }
  // Seed forced activations (e.g. colour-bomb swap).
  for (const p of forced) {
    clearSet.set(key(p), p);
    queue.push(p);
  }

  // Resolve chained special detonations.
  while (queue.length > 0) {
    const p = queue.shift()!;
    if (activated.has(key(p))) {
      continue;
    }
    const cell = board[p.row][p.col];
    if (!cell || cell.special === 'none') {
      continue;
    }
    activated.add(key(p));
    detonated.push(p);

    const targetColor =
      options.bombTargetColors?.get(key(p)) ?? cell.color;
    const area = computeBlast(board, p, cell.special, targetColor);

    for (const bp of area) {
      const bcell = board[bp.row]?.[bp.col];
      if (!bcell) {
        continue;
      }
      if (isSolid(bcell)) {
        // Obstacle directly hit by a blast.
        if (bcell.chocolate) {
          chocoClears.set(key(bp), bp);
        } else if (bcell.locked) {
          lockFrees.set(key(bp), bp);
        } else if (bcell.iceLayers > 0) {
          iceHits.set(key(bp), bp);
        }
      } else {
        if (!clearSet.has(key(bp))) {
          clearSet.set(key(bp), bp);
        }
        if (bcell.special !== 'none' && !activated.has(key(bp))) {
          queue.push(bp);
        }
      }
    }
  }

  // Spawn positions must survive (they host the new special candy).
  const spawnKeys = new Set(matchResult.spawns.map(s => key(s.position)));
  for (const sk of spawnKeys) {
    clearSet.delete(sk);
  }

  // Obstacles adjacent to a cleared candy are also affected.
  for (const p of clearSet.values()) {
    for (const n of neighbors(p)) {
      const ncell = board[n.row][n.col];
      if (!ncell) {
        continue;
      }
      if (ncell.chocolate) {
        chocoClears.set(key(n), n);
      } else if (ncell.locked) {
        lockFrees.set(key(n), n);
      } else if (ncell.iceLayers > 0) {
        iceHits.set(key(n), n);
      }
    }
  }

  // --- Apply everything to the cloned board -------------------------------
  for (const p of clearSet.values()) {
    next[p.row][p.col] = null;
  }
  for (const s of matchResult.spawns) {
    next[s.position.row][s.position.col] = makeSpecial(s.kind, s.color);
  }
  for (const p of iceHits.values()) {
    const cell = next[p.row][p.col];
    if (cell && cell.iceLayers > 0) {
      cell.iceLayers = Math.max(0, cell.iceLayers - 1);
    }
  }
  for (const p of lockFrees.values()) {
    const cell = next[p.row][p.col];
    if (cell) {
      cell.locked = false;
    }
  }
  for (const p of chocoClears.values()) {
    next[p.row][p.col] = null;
  }

  // --- Score --------------------------------------------------------------
  const baseMatched = matchResult.matchedCells.length;
  const totalCleared = clearSet.size;
  const specialClears = Math.max(0, totalCleared - baseMatched);
  const scoreGained = computeScore({
    runs: matchResult.runs,
    spawnedCount: matchResult.spawns.length,
    specialClears,
    iceBroken: iceHits.size,
    chocoCleared: chocoClears.size,
    combo: options.combo,
  });

  const event: ClearEvent = {
    cleared: [...clearSet.values()],
    iceBroken: [...iceHits.values()],
    locksFreed: [...lockFrees.values()],
    chocolateCleared: [...chocoClears.values()],
    spawned: matchResult.spawns as SpecialSpawn[],
    detonated,
    scoreGained,
    largestMatch: matchResult.runs.reduce((m, r) => Math.max(m, r.length), 0),
  };

  return {boardAfterClear: next, event};
}

export interface ResolveOptions {
  forcedActivations?: Position[];
  bombTargetColors?: Map<string, number>;
  rng?: Rng;
}

/**
 * Resolves a board to a stable state, returning every cascade step in order.
 * The first step may carry forced activations (e.g. a colour-bomb swap); all
 * subsequent steps are driven purely by newly formed matches.
 */
export function resolveBoard(
  board: Board,
  options: ResolveOptions = {},
): CascadeStep[] {
  const rng = options.rng ?? defaultRng;
  const steps: CascadeStep[] = [];
  let current = cloneBoard(board);
  let combo = 1;

  while (combo <= 50) {
    const result = computeClear(current, {
      combo,
      forcedActivations: combo === 1 ? options.forcedActivations : undefined,
      bombTargetColors: combo === 1 ? options.bombTargetColors : undefined,
    });
    if (!result) {
      break;
    }
    const boardAfterGravity = applyGravityAndRefill(result.boardAfterClear, rng);
    steps.push({
      boardAfterClear: result.boardAfterClear,
      boardAfterGravity,
      event: result.event,
      combo,
    });
    current = boardAfterGravity;
    combo++;
  }

  return steps;
}

/** Sum of points across a list of cascade steps. */
export function totalScore(steps: CascadeStep[]): number {
  return steps.reduce((sum, s) => sum + s.event.scoreGained, 0);
}
