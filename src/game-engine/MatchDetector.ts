/**
 * MatchDetector
 * -------------
 * Pure functions that scan a board for runs of 3+ same-colour candies and
 * decide which special candies those matches should spawn.
 *
 * Special-spawn rules:
 *   - 5+ in a straight line          -> colour bomb
 *   - L / T shape (h-run x v-run)    -> wrapped candy at the intersection
 *   - exactly 4 in a line            -> striped candy (stripes perpendicular to
 *                                       the run: a horizontal run clears columns,
 *                                       a vertical run clears rows)
 *   - exactly 3                      -> no special
 */

import {BOARD_COLS, BOARD_ROWS} from '../constants';
import {Board, MatchResult, MatchRun, Position, SpecialKind, SpecialSpawn} from '../types';
import {isMatchable} from '../utils/grid';

const key = (p: Position) => `${p.row},${p.col}`;

/** All horizontal runs of length >= 3. */
export function findHorizontalRuns(board: Board): MatchRun[] {
  const runs: MatchRun[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    let c = 0;
    while (c < BOARD_COLS) {
      const cell = board[r][c];
      if (!isMatchable(cell)) {
        c++;
        continue;
      }
      let len = 1;
      while (c + len < BOARD_COLS) {
        const next = board[r][c + len];
        if (isMatchable(next) && next!.color === cell!.color) {
          len++;
        } else {
          break;
        }
      }
      if (len >= 3) {
        const cells: Position[] = [];
        for (let k = 0; k < len; k++) {
          cells.push({row: r, col: c + k});
        }
        runs.push({cells, orientation: 'horizontal', color: cell!.color, length: len});
      }
      c += len;
    }
  }
  return runs;
}

/** All vertical runs of length >= 3. */
export function findVerticalRuns(board: Board): MatchRun[] {
  const runs: MatchRun[] = [];
  for (let c = 0; c < BOARD_COLS; c++) {
    let r = 0;
    while (r < BOARD_ROWS) {
      const cell = board[r][c];
      if (!isMatchable(cell)) {
        r++;
        continue;
      }
      let len = 1;
      while (r + len < BOARD_ROWS) {
        const next = board[r + len][c];
        if (isMatchable(next) && next!.color === cell!.color) {
          len++;
        } else {
          break;
        }
      }
      if (len >= 3) {
        const cells: Position[] = [];
        for (let k = 0; k < len; k++) {
          cells.push({row: r + k, col: c});
        }
        runs.push({cells, orientation: 'vertical', color: cell!.color, length: len});
      }
      r += len;
    }
  }
  return runs;
}

/** True if the board currently contains at least one match. */
export function hasAnyMatch(board: Board): boolean {
  return findHorizontalRuns(board).length > 0 || findVerticalRuns(board).length > 0;
}

/**
 * Full scan: returns every matched cell, the runs, and the special candies that
 * should be spawned.
 */
export function findMatches(board: Board): MatchResult {
  const horizontal = findHorizontalRuns(board);
  const vertical = findVerticalRuns(board);
  const allRuns = [...horizontal, ...vertical];

  // Union of all matched cells.
  const matchedMap = new Map<string, Position>();
  for (const run of allRuns) {
    for (const p of run.cells) {
      matchedMap.set(key(p), p);
    }
  }
  const matchedCells = [...matchedMap.values()];

  // Map each cell to the horizontal / vertical run that contains it.
  const hByCell = new Map<string, MatchRun>();
  const vByCell = new Map<string, MatchRun>();
  for (const run of horizontal) {
    for (const p of run.cells) {
      hByCell.set(key(p), run);
    }
  }
  for (const run of vertical) {
    for (const p of run.cells) {
      vByCell.set(key(p), run);
    }
  }

  const spawns: SpecialSpawn[] = [];
  const consumed = new Set<MatchRun>();
  const usedPos = new Set<string>();

  // 1) Straight runs of 5+ become colour bombs (highest priority).
  for (const run of allRuns) {
    if (run.length >= 5) {
      const center = run.cells[Math.floor(run.cells.length / 2)];
      spawns.push({position: center, kind: 'bomb', color: run.color});
      consumed.add(run);
      usedPos.add(key(center));
    }
  }

  // 2) Intersections of an (unconsumed) h-run and v-run become wrapped candies.
  for (const [k, p] of matchedMap) {
    if (usedPos.has(k)) {
      continue;
    }
    const hr = hByCell.get(k);
    const vr = vByCell.get(k);
    if (hr && vr && !consumed.has(hr) && !consumed.has(vr)) {
      spawns.push({position: p, kind: 'wrapped', color: hr.color});
      consumed.add(hr);
      consumed.add(vr);
      usedPos.add(k);
    }
  }

  // 3) Remaining runs of exactly 4 become striped candies.
  for (const run of allRuns) {
    if (consumed.has(run) || run.length !== 4) {
      continue;
    }
    // Stripes are perpendicular to the run direction.
    const kind: SpecialKind =
      run.orientation === 'horizontal' ? 'striped-v' : 'striped-h';
    const center = run.cells[Math.floor(run.cells.length / 2)];
    const ck = key(center);
    if (!usedPos.has(ck)) {
      spawns.push({position: center, kind, color: run.color});
      usedPos.add(ck);
    }
  }

  return {matchedCells, runs: allRuns, spawns};
}
