/**
 * GameHUD
 * -------
 * Top-of-screen heads-up display: a level pill + pause button, then a single
 * card holding the score / moves / target stats and the objective progress bar.
 */

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {objectiveProgress} from '../game-engine/LevelEngine';
import {palette, radius, shadow, spacing} from '../constants/theme';
import {useGameStore} from '../store/gameStore';
import {formatScore} from '../utils/helpers';

interface GameHUDProps {
  onPause: () => void;
}

export default function GameHUD({onPause}: GameHUDProps) {
  const level = useGameStore(s => s.level);
  const board = useGameStore(s => s.board);
  const score = useGameStore(s => s.score);
  const movesLeft = useGameStore(s => s.movesLeft);

  if (!level) {
    return null;
  }

  const progress = objectiveProgress(level, board, score);
  const ratio =
    progress.target > 0 ? Math.min(1, progress.current / progress.target) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.levelPill}>
          <View style={styles.levelNum}>
            <Text style={styles.levelNumText}>{level.id}</Text>
          </View>
          <View style={styles.levelTextWrap}>
            <Text style={styles.levelKicker}>LEVEL</Text>
            <Text style={styles.levelName} numberOfLines={1}>
              {level.name}
            </Text>
          </View>
        </View>
        <Pressable style={styles.pause} onPress={onPause} hitSlop={10}>
          <Text style={styles.pauseGlyph}>⏸</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.statsRow}>
          <Stat label="Score" value={formatScore(score)} />
          <View style={styles.vDivider} />
          <Stat label="Moves" value={String(movesLeft)} highlight />
          <View style={styles.vDivider} />
          <Stat label="Target" value={formatScore(level.targetScore)} />
        </View>

        <View style={styles.hDivider} />

        <View style={styles.objectiveRow}>
          <Text style={styles.objectiveLabel} numberOfLines={1}>
            {progress.label}
          </Text>
          <Text style={styles.objectiveCount}>
            {progress.current}/{progress.target}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${ratio * 100}%`}]} />
        </View>
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && styles.statValueHi]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.panel,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.panelLight,
    paddingLeft: 6,
    paddingRight: spacing.lg,
    paddingVertical: 6,
    ...shadow,
  },
  levelNum: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  levelNumText: {color: '#FFFFFF', fontSize: 18, fontWeight: '900'},
  levelTextWrap: {justifyContent: 'center'},
  levelKicker: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  levelName: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '900',
    maxWidth: 190,
  },
  pause: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  pauseGlyph: {color: palette.accent, fontSize: 18, fontWeight: '900'},

  card: {
    backgroundColor: palette.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.panelLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow,
  },
  statsRow: {flexDirection: 'row', alignItems: 'center'},
  stat: {flex: 1, alignItems: 'center'},
  statValue: {color: palette.text, fontSize: 22, fontWeight: '900'},
  statValueHi: {color: palette.accent, fontSize: 24},
  statLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  vDivider: {width: 1, height: 34, backgroundColor: palette.panelLight},

  hDivider: {
    height: 1,
    backgroundColor: palette.panelLight,
    marginVertical: spacing.md,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  objectiveLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  objectiveCount: {color: palette.accentDark, fontSize: 13, fontWeight: '800'},
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.panelLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: palette.success,
  },
});
