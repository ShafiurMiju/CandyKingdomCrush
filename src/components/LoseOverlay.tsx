/** Shown when the player runs out of moves before completing the objective. */

import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {objectiveProgress} from '../game-engine/LevelEngine';
import {palette, spacing} from '../constants/theme';
import {useGameStore} from '../store/gameStore';
import {formatScore} from '../utils/helpers';
import Button from './Button';
import OverlayContainer from './OverlayContainer';

interface LoseOverlayProps {
  onRetry: () => void;
  onHome: () => void;
}

export default function LoseOverlay({onRetry, onHome}: LoseOverlayProps) {
  const score = useGameStore(s => s.score);
  const level = useGameStore(s => s.level);
  const board = useGameStore(s => s.board);

  const progress = level ? objectiveProgress(level, board, score) : null;

  return (
    <OverlayContainer>
      <Text style={styles.emoji}>😢</Text>
      <Text style={styles.title}>Out of Moves</Text>
      {progress ? (
        <Text style={styles.subtitle}>
          {progress.label}: {progress.current}/{progress.target}
        </Text>
      ) : null}

      <Text style={styles.scoreLabel}>Your score</Text>
      <Text style={styles.score}>{formatScore(score)}</Text>

      <Button title="Retry" icon="🔁" onPress={onRetry} style={styles.btn} />
      <Button title="Levels" variant="ghost" onPress={onHome} style={styles.btn} />
    </OverlayContainer>
  );
}

const styles = StyleSheet.create({
  emoji: {fontSize: 48},
  title: {color: palette.text, fontSize: 26, fontWeight: '900', marginTop: spacing.xs},
  subtitle: {color: palette.textMuted, fontSize: 14, marginBottom: spacing.md, textAlign: 'center'},
  scoreLabel: {color: palette.textMuted, fontSize: 13, marginTop: spacing.md},
  score: {color: palette.accent, fontSize: 32, fontWeight: '900', marginBottom: spacing.lg},
  btn: {marginTop: spacing.sm, width: '100%'},
});
