/** Minimal arrow-only back button for screen headers. */

import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {palette} from '../constants/theme';

interface BackButtonProps {
  onPress: () => void;
}

export default function BackButton({onPress}: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={14}
      style={({pressed}) => [styles.btn, pressed && styles.pressed]}>
      <Text style={styles.arrow}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
  },
  pressed: {
    transform: [{scale: 0.9}],
    opacity: 0.6,
  },
  arrow: {
    color: palette.text,
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 40,
    textShadowColor: 'rgba(255,255,255,0.85)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
});
