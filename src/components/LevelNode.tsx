/** A single level card in the Level Select grid. */

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {palette, radius, shadow} from '../constants/theme';
import {LevelConfig, LevelProgress} from '../types';
import StarRating from './StarRating';

interface LevelNodeProps {
  level: LevelConfig;
  progress: LevelProgress;
  onPress: () => void;
}

export default function LevelNode({level, progress, onPress}: LevelNodeProps) {
  const locked = !progress.unlocked;

  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      style={({pressed}) => [
        styles.node,
        locked ? styles.locked : styles.unlocked,
        pressed && !locked && styles.pressed,
      ]}>
      {locked ? (
        <Text style={styles.lockGlyph}>🔒</Text>
      ) : (
        <>
          <Text style={styles.number}>{level.id}</Text>
          <StarRating stars={progress.stars} size={13} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  node: {
    width: 78,
    height: 78,
    borderRadius: radius.md,
    margin: 7,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  unlocked: {
    backgroundColor: palette.panelLight,
    borderWidth: 2,
    borderColor: palette.accent,
  },
  locked: {
    backgroundColor: palette.panel,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.7,
  },
  pressed: {transform: [{scale: 0.95}], opacity: 0.9},
  number: {color: palette.text, fontSize: 26, fontWeight: '900', marginBottom: 2},
  lockGlyph: {fontSize: 26},
});
