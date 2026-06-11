/**
 * Board
 * -----
 * Renders the candy grid and translates swipe gestures into swap intents.
 * A single Pan gesture covers the whole grid: the touch start position maps to a
 * cell, and the dominant swipe axis maps to a direction. Candies are keyed by
 * their stable id so React reuses them across moves and they animate themselves.
 */

import React, {useEffect} from 'react';
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
  BOARD_PADDING,
  BOARD_SIZE,
  GRID_HEIGHT,
  GRID_WIDTH,
  TILE_SIZE,
} from '../constants/layout';
import {palette, radius} from '../constants/theme';
import {SwipeDirection} from '../hooks/useGameBoard';
import {useGameStore} from '../store/gameStore';
import {Position} from '../types';
import Candy from './Candy';

interface BoardProps {
  onSwipe: (from: Position, dir: SwipeDirection) => void;
  /** Increments whenever an invalid move is attempted (triggers a shake). */
  invalidNonce: number;
}

function BoardComponent({onSwipe, invalidNonce}: BoardProps) {
  const board = useGameStore(s => s.board);
  const poppingIds = useGameStore(s => s.poppingIds);
  const popSet = React.useMemo(() => new Set(poppingIds), [poppingIds]);

  // Gesture start position (UI-thread shared values).
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

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
    })
    .onEnd(e => {
      const dx = e.translationX;
      const dy = e.translationY;
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        return;
      }
      const col = Math.min(
        Math.max(Math.floor(startX.value / TILE_SIZE), 0),
        BOARD_COLS - 1,
      );
      const row = Math.min(
        Math.max(Math.floor(startY.value / TILE_SIZE), 0),
        BOARD_ROWS - 1,
      );
      let dir: SwipeDirection;
      if (Math.abs(dx) >= Math.abs(dy)) {
        dir = dx > 0 ? 'right' : 'left';
      } else {
        dir = dy > 0 ? 'down' : 'up';
      }
      runOnJS(onSwipe)({row, col}, dir);
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
              left: c * TILE_SIZE,
              top: r * TILE_SIZE,
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
    width: BOARD_SIZE,
    height: BOARD_SIZE,
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
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  candyLayer: {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
  },
});

export const Board = React.memo(BoardComponent);
export default Board;
