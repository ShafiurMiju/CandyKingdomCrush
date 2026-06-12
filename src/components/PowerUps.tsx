/**
 * PowerUps
 * --------
 * In-game rewarded-ad power-ups, shown while playing: watch an ad to drop a
 * colour bomb onto the board, or to add extra moves.
 */

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {palette, radius, shadow, spacing} from '../constants/theme';
import {AdsService} from '../services/ads';
import {useGameStore} from '../store/gameStore';

const EXTRA_MOVES = 5;

export default function PowerUps() {
  const status = useGameStore(s => s.status);
  const busy = useGameStore(s => s.busy);
  const spawnBomb = useGameStore(s => s.spawnBomb);
  const addMoves = useGameStore(s => s.addMoves);

  if (status !== 'playing') {
    return null;
  }

  return (
    <View style={styles.row}>
      <PowerButton
        icon="💣"
        label="Bomb"
        disabled={busy}
        onPress={() => AdsService.showRewarded(spawnBomb)}
      />
      <PowerButton
        icon="➕"
        label={`+${EXTRA_MOVES} Moves`}
        disabled={busy}
        onPress={() => AdsService.showRewarded(() => addMoves(EXTRA_MOVES))}
      />
    </View>
  );
}

function PowerButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.btn,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.adBadge}>
        <Text style={styles.adText}>AD</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.panel,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: palette.panelLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadow,
  },
  pressed: {transform: [{scale: 0.96}], opacity: 0.9},
  disabled: {opacity: 0.5},
  icon: {fontSize: 18, marginRight: spacing.xs},
  label: {color: palette.text, fontSize: 14, fontWeight: '800'},
  adBadge: {
    marginLeft: spacing.sm,
    backgroundColor: palette.accent,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adText: {color: '#FFFFFF', fontSize: 10, fontWeight: '900'},
});
