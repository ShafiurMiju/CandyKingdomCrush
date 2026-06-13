/** Shown when the player runs out of moves before completing the objective. */

import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {isTimedLevel, objectiveProgress} from '../game-engine/LevelEngine';
import {palette, spacing} from '../constants/theme';
import {AdsService} from '../services/ads';
import {useGameStore} from '../store/gameStore';
import {formatScore} from '../utils/helpers';
import Button from './Button';
import OverlayContainer from './OverlayContainer';

const CONTINUE_MOVES = 5;
const CONTINUE_SECONDS = 20;

interface LoseOverlayProps {
  onRetry: () => void;
  onHome: () => void;
}

export default function LoseOverlay({onRetry, onHome}: LoseOverlayProps) {
  const score = useGameStore(s => s.score);
  const level = useGameStore(s => s.level);
  const board = useGameStore(s => s.board);
  const continueWithMoves = useGameStore(s => s.continueWithMoves);
  const continueWithTime = useGameStore(s => s.continueWithTime);

  const timed = level ? isTimedLevel(level) : false;
  const progress = level ? objectiveProgress(level, board, score) : null;
  // Only offer "continue" when a rewarded ad is actually ready to show.
  const canContinue = AdsService.isRewardedReady();

  // Time levels revive with extra seconds; move levels with extra swaps.
  const onContinue = () =>
    AdsService.showRewarded(() =>
      timed
        ? continueWithTime(CONTINUE_SECONDS)
        : continueWithMoves(CONTINUE_MOVES),
    );

  return (
    <OverlayContainer>
      <Text style={styles.emoji}>😢</Text>
      <Text style={styles.title}>{timed ? "Time's Up" : 'Out of Moves'}</Text>
      {progress ? (
        <Text style={styles.subtitle}>
          {progress.label}: {progress.current}/{progress.target}
        </Text>
      ) : null}

      <Text style={styles.scoreLabel}>Your score</Text>
      <Text style={styles.score}>{formatScore(score)}</Text>

      {canContinue ? (
        <Button
          title={
            timed
              ? `Continue +${CONTINUE_SECONDS}s`
              : `Continue +${CONTINUE_MOVES} Moves`
          }
          icon="📺"
          onPress={onContinue}
          style={styles.btn}
        />
      ) : null}
      <Button
        title="Retry"
        icon="🔁"
        variant={canContinue ? 'secondary' : 'primary'}
        onPress={onRetry}
        style={styles.btn}
      />
      <Button
        title="Levels"
        variant="ghost"
        onPress={onHome}
        style={styles.btn}
        textStyle={styles.levelsText}
      />
    </OverlayContainer>
  );
}

const styles = StyleSheet.create({
  emoji: {fontSize: 48},
  title: {color: palette.panel, fontSize: 26, fontWeight: '900', marginTop: spacing.xs},
  subtitle: {color: palette.panel, fontSize: 14, marginBottom: spacing.md, textAlign: 'center'},
  scoreLabel: {color: palette.panel, fontSize: 13, marginTop: spacing.md},
  score: {color: palette.accent, fontSize: 32, fontWeight: '900', marginBottom: spacing.lg},
  btn: {marginTop: spacing.sm, width: '100%'},
  levelsText: {color: palette.panel},
});
