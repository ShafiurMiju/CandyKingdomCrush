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
  /** Current cascade combo (for the floating "Combo xN" toast); 0 when idle. */
  combo: number;
  /** True while a swap/cascade animation sequence is running. */
  busy: boolean;
  /** Candy ids currently animating out (so the Board can pop before unmount). */
  poppingIds: number[];

  startLevel: (level: LevelConfig) => void;
  setBoard: (board: Board) => void;
  addScore: (points: number) => void;
  consumeMove: () => void;
  setCombo: (combo: number) => void;
  setBusy: (busy: boolean) => void;
  setPopping: (ids: number[]) => void;
  setStatus: (status: GameStatus) => void;
  pause: () => void;
  resume: () => void;
  finish: (status: 'won' | 'lost', stars: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>(set => ({
  level: null,
  board: [],
  score: 0,
  movesLeft: 0,
  status: 'idle',
  starsEarned: 0,
  combo: 0,
  busy: false,
  poppingIds: [],

  startLevel: level =>
    set({
      level,
      board: generateBoardForLevel(level),
      score: 0,
      movesLeft: level.moves,
      status: 'playing',
      starsEarned: 0,
      combo: 0,
      busy: false,
      poppingIds: [],
    }),

  setBoard: board => set({board}),
  addScore: points => set(state => ({score: state.score + points})),
  consumeMove: () => set(state => ({movesLeft: Math.max(0, state.movesLeft - 1)})),
  setCombo: combo => set({combo}),
  setBusy: busy => set({busy}),
  setPopping: ids => set({poppingIds: ids}),
  setStatus: status => set({status}),

  pause: () => set(state => (state.status === 'playing' ? {status: 'paused'} : {})),
  resume: () => set(state => (state.status === 'paused' ? {status: 'playing'} : {})),

  finish: (status, stars) => set({status, starsEarned: stars, busy: false, combo: 0}),

  reset: () =>
    set({
      level: null,
      board: [],
      score: 0,
      movesLeft: 0,
      status: 'idle',
      starsEarned: 0,
      combo: 0,
      busy: false,
      poppingIds: [],
    }),
}));
