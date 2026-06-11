/**
 * useGameBoard
 * ------------
 * Orchestrates a single player move end-to-end:
 *   swipe -> validate -> animate swap -> (revert if invalid) -> resolve cascade
 *   step by step with delays -> spread chocolate -> evaluate win/lose/reshuffle.
 *
 * It reads/writes the gameStore via setters so the UI animates reactively, and
 * uses timed delays (ANIM.*) so the engine's discrete cascade steps play out as
 * smooth sequential animations.
 */

import {useCallback, useRef, useState} from 'react';

import {ANIM} from '../constants';
import {reshuffleBoard} from '../game-engine/BoardGenerator';
import {resolveBoard} from '../game-engine/CascadeEngine';
import {evaluateLevel, countChocolate} from '../game-engine/LevelEngine';
import {ALL_COLORS, spreadChocolate} from '../game-engine/PowerUpEngine';
import {
  hasAvailableMove,
  involvesColorBomb,
  isSwapAllowed,
  swapCells,
  wouldCreateMatch,
} from '../game-engine/SwapValidator';
import {useProgressStore} from '../store/progressStore';
import {useGameStore} from '../store/gameStore';
import {Position} from '../types';
import {delay} from '../utils/helpers';
import {useSound} from './useSound';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

function targetOf(from: Position, dir: SwipeDirection): Position {
  switch (dir) {
    case 'up':
      return {row: from.row - 1, col: from.col};
    case 'down':
      return {row: from.row + 1, col: from.col};
    case 'left':
      return {row: from.row, col: from.col - 1};
    case 'right':
      return {row: from.row, col: from.col + 1};
  }
}

const keyOf = (p: Position) => `${p.row},${p.col}`;

export function useGameBoard() {
  const sound = useSound();
  const recordResult = useProgressStore(s => s.recordResult);
  // Nonce the Board watches to trigger an "invalid move" shake.
  const [invalidNonce, setInvalidNonce] = useState(0);
  const busyRef = useRef(false);

  const attemptMove = useCallback(
    async (from: Position, to: Position) => {
      const store = useGameStore.getState();
      if (busyRef.current || store.status !== 'playing') {
        return;
      }
      const board = store.board;

      if (!isSwapAllowed(board, from, to)) {
        sound.play('invalid');
        setInvalidNonce(n => n + 1);
        return;
      }

      const colorBomb = involvesColorBomb(board, from, to);
      const valid = colorBomb || wouldCreateMatch(board, from, to);

      busyRef.current = true;
      store.setBusy(true);
      sound.play('swap');

      // Animate the swap. The two ids are flagged so they animate with swap
      // emphasis (lift + pulse) instead of the default gravity easing.
      const swapped = swapCells(board, from, to);
      const swapIds = [
        board[from.row][from.col]?.id,
        board[to.row][to.col]?.id,
      ].filter((id): id is number => id != null);
      store.setSwapping(swapIds);
      store.setBoard(swapped);
      await delay(ANIM.swap);

      if (!valid) {
        // Revert: animate back and shake.
        sound.play('invalid');
        setInvalidNonce(n => n + 1);
        store.setBoard(board);
        await delay(ANIM.swap);
        store.setSwapping([]);
        store.setBusy(false);
        busyRef.current = false;
        return;
      }
      store.setSwapping([]);

      // Build resolve options (colour-bomb swaps detonate without a match).
      let options: {
        forcedActivations?: Position[];
        bombTargetColors?: Map<string, number>;
      } = {};
      if (colorBomb) {
        const bombAtTo = swapped[to.row][to.col]?.special === 'bomb';
        const bombPos = bombAtTo ? to : from;
        const otherPos = bombAtTo ? from : to;
        const otherCell = swapped[otherPos.row][otherPos.col];
        const targetColor =
          otherCell?.special === 'bomb' ? ALL_COLORS : otherCell?.color ?? 0;
        const map = new Map<string, number>();
        map.set(keyOf(bombPos), targetColor);
        options = {forcedActivations: [bombPos], bombTargetColors: map};
      }

      const steps = resolveBoard(swapped, options);
      store.consumeMove();

      // Play each cascade step: pop the cleared candies, then gravity/refill.
      for (const step of steps) {
        store.setCombo(step.combo);
        store.addScore(step.event.scoreGained);
        if (step.event.detonated.length > 0) {
          sound.play('special');
        } else {
          sound.play('match');
        }
        if (step.combo >= 3) {
          sound.play('combo');
        }

        // Mark cleared / chocolate candies as popping (still mounted) so they
        // animate out before the board state removes them.
        const preBoard = useGameStore.getState().board;
        const popPositions = [...step.event.cleared, ...step.event.chocolateCleared];
        const poppingIds = popPositions
          .map(p => preBoard[p.row]?.[p.col]?.id)
          .filter((id): id is number => id != null);
        store.setPopping(poppingIds);
        await delay(ANIM.pop);

        // Jump straight to the post-gravity board: surviving candies animate
        // down from their current positions, new candies fall in from the top,
        // and the popped candies (already faded out) unmount cleanly.
        store.setPopping([]);
        store.setBoard(step.boardAfterGravity);
        await delay(ANIM.fall);
      }
      store.setCombo(0);

      // Chocolate spreads once per move if none was cleared this move.
      let finalBoard = useGameStore.getState().board;
      const clearedChocolate = steps.some(
        s => s.event.chocolateCleared.length > 0,
      );
      if (countChocolate(finalBoard) > 0 && !clearedChocolate) {
        const {board: spreadBoard, spreadTo} = spreadChocolate(finalBoard);
        if (spreadTo) {
          finalBoard = spreadBoard;
          store.setBoard(spreadBoard);
          await delay(ANIM.pop);
        }
      }

      // Evaluate the level.
      const latest = useGameStore.getState();
      const level = latest.level!;
      const result = evaluateLevel(
        level,
        finalBoard,
        latest.score,
        latest.movesLeft,
      );

      if (result.status === 'won') {
        sound.playMusic('win');
        recordResult(level.id, result.stars, latest.score);
        store.finish('won', result.stars);
      } else if (result.status === 'lost') {
        sound.playMusic('lose');
        store.finish('lost', 0);
      } else {
        // Rescue a dead board so the player always has a move.
        if (!hasAvailableMove(finalBoard)) {
          store.setBoard(reshuffleBoard(finalBoard));
        }
        store.setBusy(false);
      }
      busyRef.current = false;
    },
    [recordResult, sound],
  );

  const onSwipe = useCallback(
    (from: Position, dir: SwipeDirection) => {
      void attemptMove(from, targetOf(from, dir));
    },
    [attemptMove],
  );

  return {onSwipe, attemptMove, invalidNonce};
}
