/** A single circular level stop on the Level Select road map. */

import React, {useEffect} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {palette, shadow} from '../constants/theme';
import {LevelConfig, LevelProgress} from '../types';
import StarRating from './StarRating';

export const LEVEL_NODE_SIZE = 82;

interface LevelNodeProps {
  level: LevelConfig;
  progress: LevelProgress;
  /** Whether the level is locked (sequential reach + star gate). */
  locked: boolean;
  /** Total stars required, shown when the node is locked by its star gate. */
  starsNeeded?: number;
  /** True for the level the player should play next (highlighted). */
  current?: boolean;
  onPress: () => void;
}

export default function LevelNode({
  level,
  progress,
  locked,
  starsNeeded,
  current,
  onPress,
}: LevelNodeProps) {
  const beaten = (progress.stars ?? 0) > 0;

  // Gentle pulse to draw the eye to the level you should play next.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (current) {
      pulse.value = withRepeat(
        withTiming(1.12, {duration: 800}),
        -1,
        true,
      );
    }
  }, [current, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{scale: pulse.value}],
  }));

  return (
    <Animated.View style={current ? pulseStyle : undefined}>
      <Pressable
        onPress={locked ? undefined : onPress}
        disabled={locked}
        style={({pressed}) => [
          styles.node,
          locked && styles.locked,
          !locked && !current && (beaten ? styles.beaten : styles.open),
          current && styles.current,
          pressed && !locked && styles.pressed,
        ]}>
        {locked ? (
          <View style={styles.lockedInner}>
            <Text style={styles.lockGlyph}>🔒</Text>
            {starsNeeded != null && (
              <Text style={styles.lockReq}>{starsNeeded}🌟</Text>
            )}
          </View>
        ) : (
          <>
            <Text style={[styles.number, current && styles.numberCurrent]}>
              {level.id}
            </Text>
            {!current && (
              <View style={styles.stars}>
                <StarRating stars={progress.stars} size={12} />
              </View>
            )}
          </>
        )}
        {!locked && progress.bonusStar && (
          <Text style={styles.bonusBadge}>🌟</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  node: {
    width: LEVEL_NODE_SIZE,
    height: LEVEL_NODE_SIZE,
    borderRadius: LEVEL_NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    ...shadow,
  },
  // Unlocked, not yet beaten.
  open: {
    backgroundColor: palette.panel,
    borderColor: palette.accent,
  },
  // Unlocked and cleared (has stars).
  beaten: {
    backgroundColor: palette.panel,
    borderColor: palette.star,
  },
  // The level to play next — bright fill, white ring, coloured glow.
  current: {
    backgroundColor: palette.accent,
    borderColor: '#FFFFFF',
    shadowColor: palette.accent,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 12,
  },
  locked: {
    backgroundColor: '#E9E1E7',
    borderColor: '#D7CDD4',
    opacity: 0.9,
  },
  pressed: {transform: [{scale: 0.94}], opacity: 0.9},
  number: {color: palette.text, fontSize: 24, fontWeight: '900'},
  numberCurrent: {color: '#FFFFFF', fontSize: 30},
  stars: {marginTop: 1},
  lockedInner: {alignItems: 'center', justifyContent: 'center'},
  lockGlyph: {fontSize: 24},
  lockReq: {color: palette.text, fontSize: 11, fontWeight: '900', marginTop: 1},
  bonusBadge: {position: 'absolute', top: -2, right: -2, fontSize: 18},
});
