/**
 * Game store: the live state of the level currently being played. The heavy
 * orchestration (swap -> cascade -> gravity -> evaluate) lives in the
 * `useGameBoard` hook, which calls these setters. Keeping board state here means
 * the HUD and overlays re-render reactively.
 */

import {create} from 'zustand';
import {generateBoardForLevel} from '../game-engine/BoardGenerator';
import {Board, GameStatus, LevelConfig} from '../types';

interface GameState {
  level: LevelConfig | null;
  board: Board;
  score: number;
  movesLeft: number;
  status: GameStatus;
  starsEarned: number;
  /** Whether the finished level earned its separate bonus star. */
  bonusStarEarned: boolean;
  /** Milliseconds left on the countdown (time levels); 0 for move levels. */
  timeLeftMs: number;
  /** Full countdown budget in ms (time levels); 0 for move levels. */
  timeLimitMs: number;
  /** Current cascade combo (for the floating "Combo xN" toast); 0 when idle. */
  combo: number;
  /** True while a swap/cascade animation sequence is running. */
  busy: boolean;
  /** Candy ids currently animating out (so the Board can pop before unmount). */
  poppingIds: number[];
  /** The two candy ids currently swapping (animated with emphasis). */
  swappingIds: number[];

  startLevel: (level: LevelConfig) => void;
  setBoard: (board: Board) => void;
  addScore: (points: number) => void;
  consumeMove: () => void;
  /** Decrement the countdown by `ms`, clamped at 0 (time levels). */
  tickTime: (ms: number) => void;
  /** Reward: grant extra swaps (rewarded-ad power-up). */
  addMoves: (n: number) => void;
  /** Reward: revive from a loss with extra swaps, resuming the same board. */
  continueWithMoves: (n: number) => void;
  /** Reward: revive a timed-level loss with extra seconds on the clock. */
  continueWithTime: (sec: number) => void;
  /** Reward: turn a random plain candy into a colour bomb (rewarded-ad power-up). */
  spawnBomb: () => void;
  setCombo: (combo: number) => void;
  setBusy: (busy: boolean) => void;
  setPopping: (ids: number[]) => void;
  setSwapping: (ids: number[]) => void;
  setStatus: (status: GameStatus) => void;
  pause: () => void;
  resume: () => void;
  finish: (status: 'won' | 'lost', stars: number, bonusStar?: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>(set => ({
  level: null,
  board: [],
  score: 0,
  movesLeft: 0,
  status: 'idle',
  starsEarned: 0,
  bonusStarEarned: false,
  timeLeftMs: 0,
  timeLimitMs: 0,
  combo: 0,
  busy: false,
  poppingIds: [],
  swappingIds: [],

  startLevel: level => {
    const timed = level.mode === 'time';
    const timeMs = timed ? (level.timeLimitSec ?? 0) * 1000 : 0;
    set({
      level,
      board: generateBoardForLevel(level),
      score: 0,
      // Move levels use a swap budget; time levels count down instead.
      movesLeft: timed ? 0 : level.moves,
      timeLeftMs: timeMs,
      timeLimitMs: timeMs,
      status: 'playing',
      starsEarned: 0,
      bonusStarEarned: false,
      combo: 0,
      busy: false,
      poppingIds: [],
      swappingIds: [],
    });
  },

  setBoard: board => set({board}),
  addScore: points => set(state => ({score: state.score + points})),
  consumeMove: () => set(state => ({movesLeft: Math.max(0, state.movesLeft - 1)})),
  tickTime: ms =>
    set(state => ({timeLeftMs: Math.max(0, state.timeLeftMs - ms)})),

  addMoves: n => set(state => ({movesLeft: state.movesLeft + n})),

  continueWithMoves: n =>
    set(state => ({
      movesLeft: state.movesLeft + n,
      status: 'playing',
      combo: 0,
      busy: false,
    })),

  continueWithTime: sec =>
    set(state => ({
      timeLeftMs: state.timeLeftMs + sec * 1000,
      status: 'playing',
      combo: 0,
      busy: false,
    })),

  spawnBomb: () =>
    set(state => {
      // Eligible: a real, movable, plain candy (not chocolate/locked/special).
      const candidates: Array<[number, number]> = [];
      state.board.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell && !cell.chocolate && !cell.locked && cell.special === 'none') {
            candidates.push([r, c]);
          }
        }),
      );
      if (candidates.length === 0) {
        return {};
      }
      const [pr, pc] = candidates[Math.floor(Math.random() * candidates.length)];
      const board = state.board.map((row, r) =>
        r === pr
          ? row.map((cell, c) =>
              c === pc && cell ? {...cell, special: 'bomb' as const} : cell,
            )
          : row,
      );
      return {board};
    }),

  setCombo: combo => set({combo}),
  setBusy: busy => set({busy}),
  setPopping: ids => set({poppingIds: ids}),
  setSwapping: ids => set({swappingIds: ids}),
  setStatus: status => set({status}),

  pause: () => set(state => (state.status === 'playing' ? {status: 'paused'} : {})),
  resume: () => set(state => (state.status === 'paused' ? {status: 'playing'} : {})),

  finish: (status, stars, bonusStar = false) =>
    set({
      status,
      starsEarned: stars,
      bonusStarEarned: bonusStar,
      busy: false,
      combo: 0,
    }),

  reset: () =>
    set({
      level: null,
      board: [],
      score: 0,
      movesLeft: 0,
      status: 'idle',
      starsEarned: 0,
      bonusStarEarned: false,
      timeLeftMs: 0,
      timeLimitMs: 0,
      combo: 0,
      busy: false,
      poppingIds: [],
      swappingIds: [],
    }),
}));
