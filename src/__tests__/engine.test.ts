/**
 * A few sanity tests demonstrating the engine is pure and testable with no UI.
 * Run with: npm test
 */

import {generateMatchFreeBoard} from '../game-engine/BoardGenerator';
import {applyGravity} from '../game-engine/GravityEngine';
import {
  bonusStarForScore,
  bonusStarForTime,
  completionRatio,
  evaluateLevel,
  isTimedLevel,
  liveStars,
  starsForScore,
  starsForTime,
} from '../game-engine/LevelEngine';
import {findMatches, hasAnyMatch} from '../game-engine/MatchDetector';
import {CandyColor, LevelConfig} from '../types';
import {emptyBoard, makeCandy, resetCellIds} from '../utils/grid';

const scoreLevel: LevelConfig = {
  id: 1,
  name: 'Score',
  objective: 'score',
  targetScore: 2000,
  moves: 23,
  description: '',
};

const timeLevel: LevelConfig = {
  id: 2,
  name: 'Time',
  objective: 'score',
  targetScore: 2000,
  moves: 0,
  mode: 'time',
  timeLimitSec: 60,
  description: '',
};

const iceLevel: LevelConfig = {
  id: 3,
  name: 'Ice',
  objective: 'clear-ice',
  targetScore: 2000,
  moves: 20,
  description: '',
};

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

describe('LevelEngine — move/score stars (finish-at-target)', () => {
  const board = emptyBoard();

  it('rates the FINAL score (after auto-play) by multiple of target', () => {
    expect(starsForScore(1599, 2000)).toBe(0); // < 0.8x
    expect(starsForScore(1600, 2000)).toBe(1); // 0.8x = 80%
    expect(starsForScore(2000, 2000)).toBe(2); // 1.0x = target
    expect(starsForScore(2400, 2000)).toBe(3); // 1.2x = 120%
    expect(starsForScore(10000, 2000)).toBe(3); // capped at 3
  });

  it('awards the separate bonus star only at the mastery multiple', () => {
    expect(bonusStarForScore(4999, 2000)).toBe(false); // < 2.5x
    expect(bonusStarForScore(5000, 2000)).toBe(true); // 2.5x
  });

  it('finishes the instant the target is reached, even with moves left', () => {
    // Reaching exactly target (1.0x) is 2★; leftover auto-play then pushes higher.
    const r = evaluateLevel(scoreLevel, board, 2000, {movesLeft: 10});
    expect(r.status).toBe('won');
    expect(r.stars).toBe(2);
    expect(r.bonusStar).toBe(false);
  });

  it('rates a big final score 3★ + bonus star', () => {
    const r = evaluateLevel(scoreLevel, board, 5000, {movesLeft: 0});
    expect(r).toMatchObject({status: 'won', stars: 3, bonusStar: true});
  });

  it('keeps playing below target, loses only when moves run out', () => {
    expect(evaluateLevel(scoreLevel, board, 1000, {movesLeft: 5}).status).toBe(
      'playing',
    );
    expect(evaluateLevel(scoreLevel, board, 1500, {movesLeft: 0})).toMatchObject(
      {status: 'lost', stars: 0, bonusStar: false},
    );
  });

  it('live stars reflect current standing (0 at start, climb with score)', () => {
    expect(liveStars(scoreLevel, board, 0)).toBe(0); // no false promise at 0
    expect(liveStars(scoreLevel, board, 1600)).toBe(1); // 0.8x
    expect(liveStars(scoreLevel, board, 2400)).toBe(3); // 1.2x
    expect(liveStars(timeLevel, board, 1000)).toBe(1); // 50% complete
  });
});

describe('LevelEngine — time stars (3★ + bonus)', () => {
  const board = emptyBoard();

  it('completion is the full 3★; timeout grants partial 1★/2★', () => {
    expect(starsForTime(true, 1)).toBe(3);
    expect(starsForTime(false, 0.7)).toBe(2);
    expect(starsForTime(false, 0.5)).toBe(1);
    expect(starsForTime(false, 0.4)).toBe(0);
  });

  it('bonus star requires completing within half the time', () => {
    expect(bonusStarForTime(true, 20000, 60000)).toBe(true); // half or less
    expect(bonusStarForTime(true, 40000, 60000)).toBe(false); // too slow
    expect(bonusStarForTime(false, 10000, 60000)).toBe(false); // not completed
  });

  it('wins on completion: 3★, bonus star within half time', () => {
    expect(
      evaluateLevel(timeLevel, board, 2000, {
        movesLeft: 0,
        timeLeftMs: 40000, // used 20s of 60s
        timeLimitMs: 60000,
      }),
    ).toMatchObject({status: 'won', stars: 3, bonusStar: true});
    expect(
      evaluateLevel(timeLevel, board, 2000, {
        movesLeft: 0,
        timeLeftMs: 10000, // used 50s
        timeLimitMs: 60000,
      }),
    ).toMatchObject({status: 'won', stars: 3, bonusStar: false});
  });

  it('settles on timeout by completion fraction', () => {
    const ctx = {movesLeft: 0, timeLeftMs: 0, timeLimitMs: 60000};
    expect(evaluateLevel(timeLevel, board, 1400, ctx)).toMatchObject({
      status: 'won',
      stars: 2,
    });
    expect(evaluateLevel(timeLevel, board, 1000, ctx)).toMatchObject({
      status: 'won',
      stars: 1,
    });
    expect(evaluateLevel(timeLevel, board, 600, ctx)).toMatchObject({
      status: 'lost',
      stars: 0,
    });
  });

  it('keeps playing while time remains and the objective is unmet', () => {
    expect(
      evaluateLevel(timeLevel, board, 1000, {
        movesLeft: 0,
        timeLeftMs: 30000,
        timeLimitMs: 60000,
      }).status,
    ).toBe('playing');
  });

  it('flags time levels and caps completion at 100%', () => {
    expect(isTimedLevel(timeLevel)).toBe(true);
    expect(isTimedLevel(scoreLevel)).toBe(false);
    expect(completionRatio(timeLevel, board, 4000)).toBe(1);
  });
});

describe('LevelEngine — obstacle (move) levels', () => {
  const board = emptyBoard(); // no ice present, so the ice objective is clearable

  it('wins on clearing the objective (≥1★), rated by score %', () => {
    expect(evaluateLevel(iceLevel, board, 4000, {movesLeft: 5})).toMatchObject({
      status: 'won',
      stars: 3,
    });
  });

  it('keeps playing below target and loses when moves run out', () => {
    expect(evaluateLevel(iceLevel, board, 1000, {movesLeft: 5}).status).toBe(
      'playing',
    );
    expect(evaluateLevel(iceLevel, board, 1000, {movesLeft: 0}).status).toBe(
      'lost',
    );
  });
});
