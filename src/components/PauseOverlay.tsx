/** Pause menu: resume, restart, quit, plus quick sound/music toggles. */

import React from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';
import {palette, spacing} from '../constants/theme';
import {useSettingsStore} from '../store/settingsStore';
import Button from './Button';
import OverlayContainer from './OverlayContainer';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export default function PauseOverlay({
  onResume,
  onRestart,
  onHome,
}: PauseOverlayProps) {
  const {soundEnabled, musicEnabled, setSound, setMusic} = useSettingsStore();

  return (
    <OverlayContainer>
      <Text style={styles.title}>Paused</Text>

      <View style={styles.toggles}>
        <ToggleRow label="🔊 Sound" value={soundEnabled} onChange={setSound} />
        <ToggleRow label="🎵 Music" value={musicEnabled} onChange={setMusic} />
      </View>

      <Button title="Resume" icon="▶️" onPress={onResume} style={styles.btn} />
      <Button
        title="Restart"
        icon="🔁"
        variant="secondary"
        onPress={onRestart}
        style={styles.btn}
      />
      <Button
        title="Quit to Levels"
        variant="ghost"
        onPress={onHome}
        style={styles.btn}
        textStyle={styles.quitText}
      />
    </OverlayContainer>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{true: palette.success, false: palette.starEmpty}}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {color: palette.panel, fontSize: 28, fontWeight: '900', marginBottom: spacing.lg},
  toggles: {width: '100%', marginBottom: spacing.md},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLabel: {color: palette.panel, fontSize: 16, fontWeight: '700'},
  btn: {marginTop: spacing.sm, width: '100%'},
  quitText: {color: palette.panel},
});
