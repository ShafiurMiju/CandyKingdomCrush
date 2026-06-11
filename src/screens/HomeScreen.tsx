import React, {useCallback} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Button from '../components/Button';
import {palette, spacing} from '../constants/theme';
import {LEVELS} from '../levels';
import {useSound} from '../hooks/useSound';
import {MAX_STARS, useProgressStore} from '../store/progressStore';
import {ScreenProps} from '../navigation/types';

export default function HomeScreen({navigation}: ScreenProps<'Home'>) {
  const totalStars = useProgressStore(s => s.totalStars());
  const levels = useProgressStore(s => s.levels);
  const sound = useSound();

  useFocusEffect(
    useCallback(() => {
      sound.playMusic('menu');
    }, [sound]),
  );

  // "Start Game" continues at the first unlocked, not-yet-beaten level.
  const continueLevelId = (() => {
    const firstUnbeaten = LEVELS.find(
      l => levels[l.id]?.unlocked && (levels[l.id]?.stars ?? 0) === 0,
    );
    if (firstUnbeaten) {
      return firstUnbeaten.id;
    }
    const lastUnlocked = [...LEVELS].reverse().find(l => levels[l.id]?.unlocked);
    return lastUnlocked?.id ?? 1;
  })();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.candies}>🍓 🍋 🍇</Text>
        <Text style={styles.title}>Candy Kingdom</Text>
        <Text style={styles.titleBig}>CRUSH</Text>
        <Text style={styles.stars}>
          ⭐ {totalStars} / {MAX_STARS}
        </Text>
      </View>

      <View style={styles.menu}>
        <Button
          title="Start Game"
          icon="🍬"
          onPress={() => navigation.navigate('Game', {levelId: continueLevelId})}
          style={styles.btn}
        />
        <Button
          title="Level Select"
          icon="🗺️"
          variant="secondary"
          onPress={() => navigation.navigate('LevelSelect')}
          style={styles.btn}
        />
        <Button
          title="Settings"
          icon="⚙️"
          variant="ghost"
          onPress={() => navigation.navigate('Settings')}
          style={styles.btn}
        />
      </View>

      <Text style={styles.footer}>Match • Crush • Conquer the Kingdom</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bgTop,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  header: {alignItems: 'center', marginTop: spacing.xl},
  candies: {fontSize: 34, letterSpacing: 6, marginBottom: spacing.md},
  title: {color: palette.text, fontSize: 30, fontWeight: '800'},
  titleBig: {
    color: palette.accent,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 4,
  },
  stars: {color: palette.text, fontSize: 18, fontWeight: '700', marginTop: spacing.md},
  menu: {width: '100%', alignItems: 'center'},
  btn: {marginVertical: spacing.sm},
  footer: {color: palette.textMuted, fontSize: 13, fontWeight: '600'},
});
