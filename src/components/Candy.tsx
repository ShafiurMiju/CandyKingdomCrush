/**
 * Candy
 * -----
 * A single animated candy tile. Position is driven by Reanimated shared values so
 * that swaps and gravity falls animate smoothly when the candy's row/col change.
 * Newly mounted candies fall in from above; "popping" candies scale + fade out
 * before the board state unmounts them.
 *
 * Special candies (striped / wrapped / bomb) and obstacle overlays (ice, lock,
 * chocolate) are drawn on top of the base coloured tile.
 */

import React, {useEffect, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {ANIM} from '../constants';
import {CANDY_INSET, CANDY_SIZE, TILE_SIZE} from '../constants/layout';
import {SPECIAL_GLYPH, candyTheme, palette, radius} from '../constants/theme';
import {Cell} from '../types';

interface CandyProps {
  cell: Cell;
  row: number;
  col: number;
  /** When true, the candy animates out (cleared) before unmount. */
  popping?: boolean;
  /** True while the player's finger is on this candy (lifts for feedback). */
  selected?: boolean;
  /** True while a drag is pointing at this candy as the swap destination. */
  targeted?: boolean;
  /** True while this candy is part of an active swap (emphasised motion). */
  swapping?: boolean;
  /** Finger-follow offsets, applied only while this candy is selected. */
  dragX?: SharedValue<number>;
  dragY?: SharedValue<number>;
}

/** Fraction of the drag offset the targeted candy mirrors (moves to meet it). */
const TARGET_NUDGE = 0.35;

function CandyComponent({
  cell,
  row,
  col,
  popping,
  selected,
  targeted,
  swapping,
  dragX,
  dragY,
}: CandyProps) {
  const targetX = col * TILE_SIZE + CANDY_INSET;
  const targetY = row * TILE_SIZE + CANDY_INSET;

  // Start above the board for a fall-in effect.
  const tx = useSharedValue(targetX);
  const ty = useSharedValue(-TILE_SIZE);
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const firstRender = useRef(true);

  // Read inside the position effect without re-triggering it.
  const swappingRef = useRef(swapping);
  swappingRef.current = swapping;

  // Animate to position on mount (fall-in) and whenever row/col change.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      tx.value = targetX;
      ty.value = withTiming(targetY, {
        duration: ANIM.fall,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {duration: 150});
      scale.value = withTiming(1, {duration: ANIM.fall});
      return;
    }
    if (swappingRef.current) {
      // Player-initiated swap: both axes use the swap easing (gravity easing
      // would make a vertical swap look like a fall) plus a scale pulse so the
      // move is unmistakable.
      const swapConfig = {
        duration: ANIM.swap,
        easing: Easing.inOut(Easing.quad),
      };
      tx.value = withTiming(targetX, swapConfig);
      ty.value = withTiming(targetY, swapConfig);
      scale.value = withSequence(
        withTiming(1.18, {duration: ANIM.swap / 2}),
        withTiming(1, {duration: ANIM.swap / 2}),
      );
      return;
    }
    tx.value = withTiming(targetX, {
      duration: ANIM.swap,
      easing: Easing.inOut(Easing.quad),
    });
    ty.value = withTiming(targetY, {
      duration: ANIM.fall,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetX, targetY, tx, ty, opacity, scale]);

  // Lift while the finger is down so the player sees which candy is grabbed.
  // Skipped while swapping/popping so it never cancels those scale animations.
  useEffect(() => {
    if (firstRender.current || popping || swapping) {
      return;
    }
    scale.value = withTiming(selected ? 1.12 : 1, {duration: 100});
  }, [selected, popping, swapping, scale]);

  // Pop out when cleared.
  useEffect(() => {
    if (popping) {
      scale.value = withTiming(0, {
        duration: ANIM.pop,
        easing: Easing.in(Easing.back(2)),
      });
      opacity.value = withTiming(0, {duration: ANIM.pop});
    }
  }, [popping, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    let followX = 0;
    let followY = 0;
    if (selected && dragX && dragY) {
      followX = dragX.value;
      followY = dragY.value;
    } else if (targeted && dragX && dragY) {
      // Move toward the grabbed candy, previewing the exchange.
      followX = -dragX.value * TARGET_NUDGE;
      followY = -dragY.value * TARGET_NUDGE;
    }
    return {
      transform: [
        {translateX: tx.value + followX},
        {translateY: ty.value + followY},
        {scale: scale.value},
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        (selected || swapping) && styles.lifted,
        animatedStyle,
      ]}
      pointerEvents="none">
      <CandyFace cell={cell} />
      {targeted && <View style={styles.targetRing} pointerEvents="none" />}
    </Animated.View>
  );
}

/** The non-animated visual contents of a candy. */
function CandyFace({cell}: {cell: Cell}) {
  if (cell.chocolate) {
    return (
      <View style={[styles.tile, styles.chocolate]}>
        <Text style={styles.glyph}>🍫</Text>
      </View>
    );
  }

  if (cell.special === 'bomb') {
    return (
      <View style={[styles.tile, styles.bomb]}>
        <Text style={styles.glyph}>💣</Text>
      </View>
    );
  }

  const theme = candyTheme(cell.color);
  const dim = cell.iceLayers > 0 || cell.locked;

  return (
    <View
      style={[
        styles.tile,
        {backgroundColor: theme.color, borderColor: theme.light},
        cell.special === 'wrapped' && styles.wrappedTile,
        dim && styles.dimmed,
      ]}>
      <Text style={styles.glyph}>{theme.glyph}</Text>

      {/* Striped overlays */}
      {cell.special === 'striped-h' && <StripesHorizontal />}
      {cell.special === 'striped-v' && <StripesVertical />}

      {/* Special badge */}
      {(cell.special === 'striped-h' ||
        cell.special === 'striped-v' ||
        cell.special === 'wrapped') && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{SPECIAL_GLYPH[cell.special]}</Text>
        </View>
      )}

      {/* Obstacle overlays */}
      {cell.locked && (
        <View style={styles.overlay}>
          <Text style={styles.overlayGlyph}>🔒</Text>
        </View>
      )}
      {cell.iceLayers > 0 && (
        <View style={[styles.overlay, styles.ice]}>
          <Text style={styles.iceGlyph}>{cell.iceLayers > 1 ? '❄️❄️' : '❄️'}</Text>
        </View>
      )}
    </View>
  );
}

function StripesHorizontal() {
  return (
    <View style={styles.stripeWrap} pointerEvents="none">
      <View style={[styles.stripeH, {top: '24%'}]} />
      <View style={[styles.stripeH, {top: '48%'}]} />
      <View style={[styles.stripeH, {top: '72%'}]} />
    </View>
  );
}

function StripesVertical() {
  return (
    <View style={styles.stripeWrap} pointerEvents="none">
      <View style={[styles.stripeV, {left: '24%'}]} />
      <View style={[styles.stripeV, {left: '48%'}]} />
      <View style={[styles.stripeV, {left: '72%'}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CANDY_SIZE,
    height: CANDY_SIZE,
  },
  lifted: {
    zIndex: 10,
    elevation: 10,
  },
  targetRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 0},
  },
  tile: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyph: {
    fontSize: Math.round(CANDY_SIZE * 0.5),
    textAlign: 'center',
  },
  dimmed: {
    opacity: 0.85,
  },
  chocolate: {
    backgroundColor: '#5A3A22',
    borderColor: '#7B4F30',
  },
  bomb: {
    backgroundColor: '#1A1130',
    borderColor: palette.accent,
    borderWidth: 3,
  },
  wrappedTile: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  stripeWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  stripeH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  stripeV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ice: {
    backgroundColor: 'rgba(190, 230, 255, 0.55)',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  iceGlyph: {
    fontSize: Math.round(CANDY_SIZE * 0.32),
  },
  overlayGlyph: {
    fontSize: Math.round(CANDY_SIZE * 0.42),
  },
});

export const Candy = React.memo(CandyComponent);
export default Candy;
