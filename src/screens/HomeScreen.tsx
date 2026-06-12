import React, {useCallback} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import AdBanner from '../components/AdBanner';
import AppBackground from '../components/AppBackground';
import Button from '../components/Button';
import {palette, radius, spacing} from '../constants/theme';

const WORDMARK = require('../assets/images/logo_wordmark.png');
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
    const lastUnlocked = [...LEVELS]
      .reverse()
      .find(l => levels[l.id]?.unlocked);
    return lastUnlocked?.id ?? 1;
  })();

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={WORDMARK}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.stars}>
            ⭐ {totalStars} / {MAX_STARS}
          </Text>
        </View>

        <View style={styles.menu}>
          <Button
            title="Start Game"
            icon="🍬"
            onPress={() =>
              navigation.navigate('Game', {levelId: continueLevelId})
            }
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

        <View style={styles.bottom}>
          <Text style={styles.footer}>Match • Crush • Conquer the Kingdom</Text>
          <AdBanner />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  header: {alignItems: 'center', marginTop: spacing.xl},
  logo: {
    width: 340,
    aspectRatio: 1024 / 540,
    shadowColor: '#000',
    shadowOpacity: 0.75,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 8},
    elevation: 14,
  },
  stars: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.md,
    backgroundColor: palette.panelLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  menu: {width: '100%', alignItems: 'center'},
  btn: {marginVertical: spacing.sm},
  bottom: {alignItems: 'center', gap: spacing.md},
  footer: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    backgroundColor: palette.panelLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
