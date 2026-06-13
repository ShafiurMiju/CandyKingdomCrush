/** Displays a 0..maxStars star rating, optionally popping the earned stars in. */

import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import {STARS_PER_LEVEL} from '../constants';
import {palette} from '../constants/theme';

interface StarRatingProps {
  stars: number;
  size?: number;
  animate?: boolean;
  /** Number of star slots to render (defaults to the per-level max). */
  maxStars?: number;
}

export default function StarRating({
  stars,
  size = 22,
  animate,
  maxStars = STARS_PER_LEVEL,
}: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({length: maxStars}, (_, i) => (
        <Star key={i} filled={i < stars} index={i} size={size} animate={!!animate} />
      ))}
    </View>
  );
}

function Star({
  filled,
  index,
  size,
  animate,
}: {
  filled: boolean;
  index: number;
  size: number;
  animate: boolean;
}) {
  const scale = useSharedValue(animate && filled ? 0 : 1);

  useEffect(() => {
    if (animate && filled) {
      scale.value = withDelay(150 + index * 220, withSpring(1, {damping: 8}));
    }
  }, [animate, filled, index, scale]);

  const style = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  return (
    <Animated.View style={style}>
      <Text
        style={[
          styles.star,
          {fontSize: size, color: filled ? palette.star : palette.starEmpty},
        ]}>
        {filled ? '★' : '☆'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center'},
  star: {marginHorizontal: 2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2},
});
