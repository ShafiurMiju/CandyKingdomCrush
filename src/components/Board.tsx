/**
 * Board
 * -----
 * Renders the candy grid and translates swipe gestures into swap intents.
 * A single Pan gesture covers the whole grid: the touch start position maps to a
 * cell, and the dominant swipe axis maps to a direction. While the finger is
 * down the touched candy lifts and follows the drag a little, and the swap
 * destination is previewed live: the target candy is ring-highlighted and
 * nudges toward the grabbed cell. The swap only commits when the touch is
 * released — keeping the finger down never triggers the move. Candies are keyed
 * by their stable id so React reuses them across moves and they animate
 * themselves.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import {BOARD_COLS, BOARD_ROWS, SWIPE_THRESHOLD} from '../constants';
import {
  BOARD_HEIGHT,
  BOARD_PADDING,
  BOARD_WIDTH,
  GRID_HEIGHT,
  GRID_WIDTH,
  TILE_HEIGHT,
  TILE_WIDTH,
} from '../constants/layout';
import {palette, radius} from '../constants/theme';
import {isSwapAllowed} from '../game-engine/SwapValidator';
import {SwipeDirection} from '../hooks/useGameBoard';
import {useGameStore} from '../store/gameStore';
import {Position} from '../types';
import Candy from './Candy';

interface BoardProps {
  onSwipe: (from: Position, dir: SwipeDirection) => void;
  /** Increments whenever an invalid move is attempted (triggers a shake). */
  invalidNonce: number;
}

/** How far (px) the grabbed candy follows the finger before clamping. */
const MAX_FOLLOW = TILE_WIDTH * 0.3;

function BoardComponent({onSwipe, invalidNonce}: BoardProps) {
  const board = useGameStore(s => s.board);
  const poppingIds = useGameStore(s => s.poppingIds);
  const swappingIds = useGameStore(s => s.swappingIds);
  const popSet = React.useMemo(() => new Set(poppingIds), [poppingIds]);
  const swapSet = React.useMemo(() => new Set(swappingIds), [swappingIds]);

  // The candy currently under the player's finger (lifted for feedback).
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // The candy the swap would land on if released now (ring-highlighted).
  const [targetId, setTargetId] = useState<number | null>(null);
  // Deselect is delayed slightly so the follow-offset can animate back first.
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectAt = useCallback((row: number, col: number) => {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    setTargetId(null);
    const state = useGameStore.getState();
    if (state.busy || state.status !== 'playing') {
      return;
    }
    setSelectedId(state.board[row]?.[col]?.id ?? null);
  }, []);

  // dir codes from the gesture worklet: -1 none, 0 up, 1 down, 2 left, 3 right.
  const updateTarget = useCallback((row: number, col: number, dir: number) => {
    if (dir < 0) {
      setTargetId(null);
      return;
    }
    const state = useGameStore.getState();
    if (state.busy || state.status !== 'playing') {
      setTargetId(null);
      return;
    }
    const from = {row, col};
    const to =
      dir === 0
        ? {row: row - 1, col}
        : dir === 1
        ? {row: row + 1, col}
        : dir === 2
        ? {row, col: col - 1}
        : {row, col: col + 1};
    // Only preview destinations the swap could actually go to.
    if (!isSwapAllowed(state.board, from, to)) {
      setTargetId(null);
      return;
    }
    setTargetId(state.board[to.row]?.[to.col]?.id ?? null);
  }, []);

  const releaseSelection = useCallback(() => {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
    }
    clearTimer.current = setTimeout(() => {
      setSelectedId(null);
      setTargetId(null);
    }, 140);
  }, []);

  useEffect(
    () => () => {
      if (clearTimer.current) {
        clearTimeout(clearTimer.current);
      }
    },
    [],
  );

  // Gesture start position (UI-thread shared values).
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  // Finger-follow offset applied to the selected candy while dragging.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  // Current dominant drag direction, mirrored to JS only when it changes.
  const dirCode = useSharedValue(-1);

  // Invalid-move shake.
  const shakeX = useSharedValue(0);
  useEffect(() => {
    if (invalidNonce > 0) {
      shakeX.value = withSequence(
        withTiming(-8, {duration: 50}),
        withTiming(8, {duration: 50}),
        withTiming(-6, {duration: 50}),
        withTiming(6, {duration: 50}),
        withTiming(0, {duration: 50}),
      );
    }
  }, [invalidNonce, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{translateX: shakeX.value}],
  }));

  const pan = Gesture.Pan()
    .onBegin(e => {
      startX.value = e.x;
      startY.value = e.y;
      dragX.value = 0;
      dragY.value = 0;
      dirCode.value = -1;
      const col = Math.min(
        Math.max(Math.floor(e.x / TILE_WIDTH), 0),
        BOARD_COLS - 1,
      );
      const row = Math.min(
        Math.max(Math.floor(e.y / TILE_HEIGHT), 0),
        BOARD_ROWS - 1,
      );
      runOnJS(selectAt)(row, col);
    })
    // While the finger is down, the grabbed candy follows the drag a little
    // (clamped, locked to the dominant axis since swaps are 4-directional)
    // and the destination candy is highlighted — no swap is committed yet.
    .onUpdate(e => {
      const dx = e.translationX;
      const dy = e.translationY;
      if (Math.abs(dx) >= Math.abs(dy)) {
        dragX.value = Math.min(Math.max(dx, -MAX_FOLLOW), MAX_FOLLOW);
        dragY.value = withTiming(0, {duration: 80});
      } else {
        dragX.value = withTiming(0, {duration: 80});
        dragY.value = Math.min(Math.max(dy, -MAX_FOLLOW), MAX_FOLLOW);
      }

      let dir = -1;
      if (Math.abs(dx) >= SWIPE_THRESHOLD || Math.abs(dy) >= SWIPE_THRESHOLD) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          dir = dx > 0 ? 3 : 2;
        } else {
          dir = dy > 0 ? 1 : 0;
        }
      }
      if (dir !== dirCode.value) {
        dirCode.value = dir;
        const col = Math.min(
          Math.max(Math.floor(startX.value / TILE_WIDTH), 0),
          BOARD_COLS - 1,
        );
        const row = Math.min(
          Math.max(Math.floor(startY.value / TILE_HEIGHT), 0),
          BOARD_ROWS - 1,
        );
        runOnJS(updateTarget)(row, col, dir);
      }
    })
    // The swap only commits when the touch is released.
    .onEnd(e => {
      const dx = e.translationX;
      const dy = e.translationY;
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        return;
      }
      const col = Math.min(
        Math.max(Math.floor(startX.value / TILE_WIDTH), 0),
        BOARD_COLS - 1,
      );
      const row = Math.min(
        Math.max(Math.floor(startY.value / TILE_HEIGHT), 0),
        BOARD_ROWS - 1,
      );
      let dir: SwipeDirection;
      if (Math.abs(dx) >= Math.abs(dy)) {
        dir = dx > 0 ? 'right' : 'left';
      } else {
        dir = dy > 0 ? 'down' : 'up';
      }
      runOnJS(onSwipe)({row, col}, dir);
    })
    .onFinalize(() => {
      dragX.value = withTiming(0, {duration: 120});
      dragY.value = withTiming(0, {duration: 120});
      dirCode.value = -1;
      runOnJS(releaseSelection)();
    });

  return (
    <Animated.View style={[styles.frame, shakeStyle]}>
      <View style={styles.grid}>
        <GridBackground />
        <GestureDetector gesture={pan}>
          <View style={styles.candyLayer}>
            {board.map((rowCells, r) =>
              rowCells.map((cell, c) =>
                cell ? (
                  <Candy
                    key={cell.id}
                    cell={cell}
                    row={r}
                    col={c}
                    popping={popSet.has(cell.id)}
                    selected={cell.id === selectedId}
                    targeted={cell.id === targetId}
                    swapping={swapSet.has(cell.id)}
                    dragX={dragX}
                    dragY={dragY}
                  />
                ) : null,
              ),
            )}
          </View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

/** Static checkerboard backdrop behind the candies. */
function GridBackground() {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const even = (r + c) % 2 === 0;
      cells.push(
        <View
          key={`bg-${r}-${c}`}
          style={[
            styles.bgCell,
            {
              left: c * TILE_WIDTH,
              top: r * TILE_HEIGHT,
              backgroundColor: even ? palette.cellEven : palette.cellOdd,
            },
          ]}
        />,
      );
    }
  }
  return <View style={styles.bgLayer}>{cells}</View>;
}

const styles = StyleSheet.create({
  frame: {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    padding: BOARD_PADDING,
    borderRadius: radius.lg,
    backgroundColor: palette.boardBg,
    borderWidth: 3,
    borderColor: palette.panelLight,
  },
  grid: {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgCell: {
    position: 'absolute',
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
  },
  candyLayer: {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
  },
});

export const Board = React.memo(BoardComponent);
export default Board;
