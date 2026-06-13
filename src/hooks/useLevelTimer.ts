/**
 * useLevelTimer
 * -------------
 * Drives the countdown for time-based levels. While a time level is playing it
 * ticks the store's `timeLeftMs` down once a second; when it reaches zero it
 * settles the level (partial-completion stars, or a loss). Move levels and the
 * paused/won/lost states run no timer — the effect simply tears down.
 */

import {useEffect} from 'react';

import {evaluateLevel} from '../game-engine/LevelEngine';
import {useProgressStore} from '../store/progressStore';
import {useGameStore} from '../store/gameStore';
import {useSound} from './useSound';

const TICK_MS = 1000;

export function useLevelTimer() {
  const status = useGameStore(s => s.status);
  const timed = useGameStore(s => s.level?.mode === 'time');
  const recordResult = useProgressStore(s => s.recordResult);
  const sound = useSound();

  useEffect(() => {
    if (!timed || status !== 'playing') {
      return;
    }
    // Never run a zero/negative countdown (guards a misconfigured time level
    // from being settled instantly — see also the levels.json loader check).
    if (useGameStore.getState().timeLeftMs <= 0) {
      return;
    }
    const id = setInterval(() => {
      const before = useGameStore.getState();
      // Don't advance the clock while paused/finished.
      if (before.status !== 'playing') {
        return;
      }
      before.tickTime(TICK_MS);

      const st = useGameStore.getState();
      // Defer settling while a swap/cascade is animating (board + score aren't
      // settled yet) or if another path already finished the level. The pending
      // move's own evaluateLevel — or the next idle tick — settles it instead.
      if (st.busy || st.status !== 'playing' || !st.level || st.timeLeftMs > 0) {
        return;
      }
      // Time's up — settle with whatever was completed.
      const result = evaluateLevel(st.level, st.board, st.score, {
        movesLeft: 0,
        timeLeftMs: 0,
        timeLimitMs: st.timeLimitMs,
      });
      if (result.status === 'won') {
        sound.playMusic('win');
        recordResult(st.level.id, result.stars, st.score, result.bonusStar);
        st.finish('won', result.stars, result.bonusStar);
      } else {
        sound.playMusic('lose');
        st.finish('lost', 0);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [timed, status, recordResult, sound]);
}
