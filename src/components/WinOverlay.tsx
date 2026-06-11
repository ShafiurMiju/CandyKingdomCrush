/** Shown when a level is won: animated stars, score summary and next actions. */

import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {palette, spacing} from '../constants/theme';
import {useGameStore} from '../store/gameStore';
import {formatScore} from '../utils/helpers';
import Button from './Button';
import OverlayContainer from './OverlayContainer';
import StarRating from './StarRating';

interface WinOverlayProps {
  onNext: (() => void) | null;
  onReplay: () => void;
  onHome: () => void;
}

export default function WinOverlay({onNext, onReplay, onHome}: WinOverlayProps) {
  const score = useGameStore(s => s.score);
  const stars = useGameStore(s => s.starsEarned);
  const level = useGameStore(s => s.level);

  return (
    <OverlayContainer>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Level Complete!</Text>
      <Text style={styles.subtitle}>{level?.name}</Text>

      <StarRating stars={stars} size={42} animate />

      <Text style={styles.scoreLabel}>Score</Text>
      <Text style={styles.score}>{formatScore(score)}</Text>

      {onNext ? (
        <Button title="Next Level" icon="▶️" onPress={onNext} style={styles.btn} />
      ) : (
        <Text style={styles.allDone}>👑 You finished Candy Kingdom!</Text>
      )}
      <Button
        title="Replay"
        icon="🔁"
        variant="secondary"
        onPress={onReplay}
        style={styles.btn}
      />
      <Button title="Levels" variant="ghost" onPress={onHome} style={styles.btn} />
    </OverlayContainer>
  );
}

const styles = StyleSheet.create({
  emoji: {fontSize: 48},
  title: {color: palette.text, fontSize: 26, fontWeight: '900', marginTop: spacing.xs},
  subtitle: {color: palette.textMuted, fontSize: 15, marginBottom: spacing.md},
  scoreLabel: {color: palette.textMuted, fontSize: 13, marginTop: spacing.lg},
  score: {color: palette.accent, fontSize: 34, fontWeight: '900', marginBottom: spacing.lg},
  allDone: {color: palette.success, fontSize: 16, fontWeight: '800', marginVertical: spacing.md, textAlign: 'center'},
  btn: {marginTop: spacing.sm, width: '100%'},
});
