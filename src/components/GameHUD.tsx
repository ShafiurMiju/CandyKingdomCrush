/**
 * GameHUD
 * -------
 * Top-of-screen heads-up display: level name, score vs target, objective
 * progress, moves remaining and a pause button.
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
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Level {level.id}</Text>
          <Text style={styles.levelName}>{level.name}</Text>
        </View>
        <Pressable style={styles.pause} onPress={onPause} hitSlop={10}>
          <Text style={styles.pauseGlyph}>⏸</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Score" value={formatScore(score)} />
        <View style={styles.movesBox}>
          <Text style={styles.movesValue}>{movesLeft}</Text>
          <Text style={styles.statLabel}>Moves</Text>
        </View>
        <Stat label="Target" value={formatScore(level.targetScore)} alignEnd />
      </View>

      <View style={styles.objective}>
        <Text style={styles.objectiveLabel}>
          {progress.label} · {progress.current}/{progress.target}
        </Text>
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
  alignEnd,
}: {
  label: string;
  value: string;
  alignEnd?: boolean;
}) {
  return (
    <View style={{alignItems: alignEnd ? 'flex-end' : 'flex-start', flex: 1}}>
      <Text style={styles.statValue}>{value}</Text>
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
  },
  levelBadge: {},
  levelText: {color: palette.accent, fontSize: 14, fontWeight: '800'},
  levelName: {color: palette.text, fontSize: 20, fontWeight: '900'},
  pause: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  pauseGlyph: {color: palette.text, fontSize: 18},
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: palette.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.panelLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  statValue: {color: palette.text, fontSize: 20, fontWeight: '900'},
  statLabel: {color: palette.textMuted, fontSize: 12, fontWeight: '600'},
  movesBox: {alignItems: 'center', flex: 1},
  movesValue: {color: palette.accent, fontSize: 26, fontWeight: '900'},
  objective: {marginTop: spacing.sm},
  objectiveLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
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
