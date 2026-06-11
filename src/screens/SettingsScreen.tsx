import React from 'react';
import {Alert, Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {palette, radius, spacing} from '../constants/theme';
import {useProgressStore} from '../store/progressStore';
import {useSettingsStore} from '../store/settingsStore';
import {ScreenProps} from '../navigation/types';

export default function SettingsScreen({navigation}: ScreenProps<'Settings'>) {
  const {soundEnabled, musicEnabled, setSound, setMusic} = useSettingsStore();
  const resetProgress = useProgressStore(s => s.reset);

  const confirmReset = () => {
    Alert.alert(
      'Reset progress?',
      'This clears all unlocked levels, stars and best scores. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void resetProgress();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.card}>
        <Row label="🔊 Sound Effects" value={soundEnabled} onChange={setSound} />
        <View style={styles.divider} />
        <Row label="🎵 Background Music" value={musicEnabled} onChange={setMusic} />
      </View>

      <Pressable style={styles.danger} onPress={confirmReset}>
        <Text style={styles.dangerText}>🗑️  Reset Progress</Text>
      </Pressable>

      <View style={styles.about}>
        <Text style={styles.aboutTitle}>Candy Kingdom Crush</Text>
        <Text style={styles.aboutText}>Version 1.0.0 · Fully offline</Text>
        <Text style={styles.aboutText}>
          Audio uses silent placeholders — drop real files into
          src/assets/sounds and wire up AudioService to enable.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Row({
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
  container: {flex: 1, backgroundColor: palette.bgTop, paddingHorizontal: spacing.lg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  back: {color: palette.accent, fontSize: 18, fontWeight: '800', width: 70},
  title: {color: palette.text, fontSize: 24, fontWeight: '900'},
  spacer: {width: 70},
  card: {
    backgroundColor: palette.panel,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowLabel: {color: palette.text, fontSize: 17, fontWeight: '700'},
  divider: {height: 1, backgroundColor: palette.panelLight, opacity: 0.4},
  danger: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,93,108,0.15)',
    borderColor: palette.danger,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerText: {color: palette.danger, fontSize: 16, fontWeight: '800'},
  about: {marginTop: 'auto', marginBottom: spacing.xl, alignItems: 'center'},
  aboutTitle: {color: palette.text, fontWeight: '800', fontSize: 15},
  aboutText: {
    color: palette.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
