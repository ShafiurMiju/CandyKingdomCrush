/**
 * LevelSelectScreen
 * -----------------
 * Saga-style road map over the candy-kingdom artwork: level stops wind along
 * an S-curve that climbs from level 1 at the bottom to the last level at the
 * top. A dotted trail connects the stops (gold where the road has been
 * unlocked) and the view auto-scrolls to the level the player should play
 * next.
 */

import React, {useCallback, useMemo, useRef} from 'react';
import {Dimensions, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import AppBackground from '../components/AppBackground';
import BackButton from '../components/BackButton';
import LevelNode, {LEVEL_NODE_SIZE} from '../components/LevelNode';
import {palette, radius, shadow, spacing} from '../constants/theme';
import {useSound} from '../hooks/useSound';
import {LEVELS} from '../levels';
import {MAX_STARS, useProgressStore} from '../store/progressStore';
import {LevelProgress} from '../types';
import {ScreenProps} from '../navigation/types';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

/** Vertical distance between consecutive level stops. */
const STEP = 118;
const TOP_PAD = 80;
const BOTTOM_PAD = 50;
/** Horizontal swing of the road around the screen centre. */
const AMPLITUDE = SCREEN_W / 2 - LEVEL_NODE_SIZE / 2 - 30;
const CONTENT_H =
  TOP_PAD + LEVEL_NODE_SIZE + STEP * (LEVELS.length - 1) + BOTTOM_PAD;

/** Centre of level stop `i` (level 1 = index 0, at the bottom). */
function nodeCenter(i: number) {
  return {
    x: SCREEN_W / 2 + AMPLITUDE * Math.sin((i * Math.PI) / 3),
    y: CONTENT_H - BOTTOM_PAD - LEVEL_NODE_SIZE / 2 - i * STEP,
  };
}

export default function LevelSelectScreen({
  navigation,
}: ScreenProps<'LevelSelect'>) {
  const levels = useProgressStore(s => s.levels);
  const totalStars = useProgressStore(s => s.totalStars());
  const sound = useSound();
  const scrollRef = useRef<ScrollView>(null);
  const didInitialScroll = useRef(false);

  // Resume menu music (e.g. coming back from a win/lose stinger).
  useFocusEffect(
    useCallback(() => {
      sound.playMusic('menu');
    }, [sound]),
  );

  const progressOf = useCallback(
    (id: number): LevelProgress =>
      levels[id] ?? {unlocked: id === 1, stars: 0, bestScore: 0},
    [levels],
  );

  // The stop the player should play next: first unbeaten unlocked level,
  // falling back to the last unlocked one.
  const currentId = useMemo(() => {
    const firstUnbeaten = LEVELS.find(
      l => progressOf(l.id).unlocked && progressOf(l.id).stars === 0,
    );
    if (firstUnbeaten) {
      return firstUnbeaten.id;
    }
    const lastUnlocked = [...LEVELS]
      .reverse()
      .find(l => progressOf(l.id).unlocked);
    return lastUnlocked?.id ?? 1;
  }, [progressOf]);

  // Start the map scrolled to the current level.
  const handleContentSize = useCallback(() => {
    if (didInitialScroll.current) {
      return;
    }
    didInitialScroll.current = true;
    const idx = Math.max(
      0,
      LEVELS.findIndex(l => l.id === currentId),
    );
    const y = Math.min(
      Math.max(0, nodeCenter(idx).y - SCREEN_H * 0.55),
      Math.max(0, CONTENT_H - SCREEN_H),
    );
    scrollRef.current?.scrollTo({y, animated: false});
  }, [currentId]);

  // Dotted trail between consecutive stops (gold once the road is open).
  const trail = useMemo(() => {
    const dots: React.ReactNode[] = [];
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const from = nodeCenter(i);
      const to = nodeCenter(i + 1);
      const open = progressOf(LEVELS[i + 1].id).unlocked;
      for (let s = 1; s <= 4; s++) {
        const t = s / 5;
        dots.push(
          <View
            key={`dot-${i}-${s}`}
            style={[
              styles.dot,
              open ? styles.dotOpen : styles.dotClosed,
              {
                left: from.x + (to.x - from.x) * t - 4.5,
                top: from.y + (to.y - from.y) * t - 4.5,
              },
            ]}
          />,
        );
      }
    }
    return dots;
  }, [progressOf]);

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <BackButton onPress={() => navigation.navigate('Home')} />
          </View>
          <View style={styles.titlePill}>
            <Text style={styles.title}>Select Level</Text>
          </View>
          <View style={[styles.headerSide, styles.starsSide]}>
            <View style={styles.starsPill}>
              <Text style={styles.starsText}>
                ⭐ {totalStars}/{MAX_STARS}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          onContentSizeChange={handleContentSize}
          contentContainerStyle={styles.map}
          showsVerticalScrollIndicator={false}>
          {trail}
          {LEVELS.map((level, i) => {
            const {x, y} = nodeCenter(i);
            return (
              <View
                key={level.id}
                style={[
                  styles.nodeWrap,
                  {
                    left: x - LEVEL_NODE_SIZE / 2,
                    top: y - LEVEL_NODE_SIZE / 2,
                  },
                ]}>
                <LevelNode
                  level={level}
                  progress={progressOf(level.id)}
                  current={level.id === currentId}
                  onPress={() =>
                    navigation.navigate('Game', {levelId: level.id})
                  }
                />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerSide: {flex: 1},
  starsSide: {alignItems: 'flex-end'},
  titlePill: {
    backgroundColor: palette.panelLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    ...shadow,
  },
  title: {color: palette.text, fontSize: 20, fontWeight: '900'},
  starsPill: {
    backgroundColor: palette.panelLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    ...shadow,
  },
  starsText: {color: palette.text, fontSize: 14, fontWeight: '800'},
  map: {
    height: CONTENT_H,
  },
  nodeWrap: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  dotOpen: {
    backgroundColor: palette.star,
  },
  dotClosed: {
    backgroundColor: palette.starEmpty,
    opacity: 0.85,
  },
});
