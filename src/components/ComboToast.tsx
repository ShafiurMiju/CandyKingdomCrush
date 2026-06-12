/** A floating "Combo xN!" toast that pops whenever the cascade combo rises. */

import React, {useEffect} from 'react';
import {StyleSheet, Text} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {comboMultiplier} from '../constants';
import {palette, radius} from '../constants/theme';
import {useGameStore} from '../store/gameStore';

export default function ComboToast() {
  const combo = useGameStore(s => s.combo);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (combo >= 2) {
      scale.value = withSequence(
        withTiming(1.15, {duration: 140}),
        withTiming(1, {duration: 120}),
      );
      opacity.value = withSequence(
        withTiming(1, {duration: 120}),
        withTiming(1, {duration: 360}),
        withTiming(0, {duration: 220}),
      );
    }
  }, [combo, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  if (combo < 2) {
    return null;
  }

  return (
    <Animated.View style={[styles.toast, style]} pointerEvents="none">
      <Text style={styles.text}>Combo x{combo}!</Text>
      <Text style={styles.mult}>×{comboMultiplier(combo)} points</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    backgroundColor: palette.accent,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  text: {fontSize: 22, fontWeight: '900', color: '#FFFFFF'},
  mult: {fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)'},
});
