/** Displays a 0..3 star rating, optionally popping the earned stars in. */

import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import {palette} from '../constants/theme';

interface StarRatingProps {
  stars: number;
  size?: number;
  animate?: boolean;
}

export default function StarRating({stars, size = 22, animate}: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[0, 1, 2].map(i => (
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
