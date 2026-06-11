/**
 * A few sanity tests demonstrating the engine is pure and testable with no UI.
 * Run with: npm test
 */

import {generateMatchFreeBoard} from '../game-engine/BoardGenerator';
import {applyGravity} from '../game-engine/GravityEngine';
import {computeStars} from '../game-engine/LevelEngine';
import {findMatches, hasAnyMatch} from '../game-engine/MatchDetector';
import {CandyColor} from '../types';
import {emptyBoard, makeCandy, resetCellIds} from '../utils/grid';

describe('BoardGenerator', () => {
  it('produces a board with no initial matches', () => {
    resetCellIds();
    const board = generateMatchFreeBoard();
    expect(hasAnyMatch(board)).toBe(false);
  });
});

describe('MatchDetector', () => {
  it('detects a horizontal run of three', () => {
    const board = emptyBoard();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        board[r][c] = makeCandy(((r + c) % 6) as CandyColor);
      }
    }
    expect(hasAnyMatch(board)).toBe(false);

    board[0][0]!.color = 0;
    board[0][1]!.color = 0;
    board[0][2]!.color = 0;

    const result = findMatches(board);
    expect(result.matchedCells.length).toBe(3);
    expect(result.spawns.length).toBe(0); // a 3-match makes no special
  });

  it('spawns a colour bomb from five in a row', () => {
    const board = emptyBoard();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        board[r][c] = makeCandy(((r + c + 1) % 6) as CandyColor);
      }
    }
    for (let c = 0; c < 5; c++) {
      board[0][c]!.color = 2;
    }
    // Guard against an accidental neighbour completing a different run.
    board[0][5]!.color = 0;
    board[1][0]!.color = 1;

    const result = findMatches(board);
    expect(result.spawns.some(s => s.kind === 'bomb')).toBe(true);
  });
});

describe('GravityEngine', () => {
  it('drops a floating candy to the bottom of its column', () => {
    const board = emptyBoard();
    board[0][0] = makeCandy(3);
    const next = applyGravity(board);
    expect(next[0][0]).toBeNull();
    expect(next[7][0]).not.toBeNull();
    expect(next[7][0]!.color).toBe(3);
  });
});

describe('LevelEngine', () => {
  it('computes star ratings from thresholds', () => {
    const t: [number, number, number] = [1000, 1500, 2000];
    expect(computeStars(500, t)).toBe(0);
    expect(computeStars(1000, t)).toBe(1);
    expect(computeStars(1600, t)).toBe(2);
    expect(computeStars(2500, t)).toBe(3);
  });
});
