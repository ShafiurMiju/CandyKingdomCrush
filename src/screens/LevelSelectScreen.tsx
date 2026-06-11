import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import LevelNode from '../components/LevelNode';
import {palette, spacing} from '../constants/theme';
import {LEVELS} from '../levels';
import {MAX_STARS, useProgressStore} from '../store/progressStore';
import {ScreenProps} from '../navigation/types';

export default function LevelSelectScreen({
  navigation,
}: ScreenProps<'LevelSelect'>) {
  const levels = useProgressStore(s => s.levels);
  const totalStars = useProgressStore(s => s.totalStars());

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')} hitSlop={12}>
          <Text style={styles.back}>‹ Home</Text>
        </Pressable>
        <Text style={styles.title}>Select Level</Text>
        <Text style={styles.stars}>⭐ {totalStars}/{MAX_STARS}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {LEVELS.map(level => (
          <LevelNode
            key={level.id}
            level={level}
            progress={
              levels[level.id] ?? {unlocked: level.id === 1, stars: 0, bestScore: 0}
            }
            onPress={() => navigation.navigate('Game', {levelId: level.id})}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: palette.bgTop, paddingHorizontal: spacing.md},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  back: {color: palette.accent, fontSize: 18, fontWeight: '800', width: 80},
  title: {color: palette.text, fontSize: 22, fontWeight: '900'},
  stars: {color: palette.text, fontSize: 15, fontWeight: '700', width: 80, textAlign: 'right'},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
});
