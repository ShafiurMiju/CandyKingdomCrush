import React from 'react';
import {Alert, Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import AppBackground from '../components/AppBackground';
import BackButton from '../components/BackButton';
import {palette, radius, shadow, spacing} from '../constants/theme';
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
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.card}>
          <Row
            label="🔊 Sound Effects"
            value={soundEnabled}
            onChange={setSound}
          />
          <View style={styles.divider} />
          <Row
            label="🎵 Background Music"
            value={musicEnabled}
            onChange={setMusic}
          />
        </View>

        <Pressable
          style={({pressed}) => [styles.danger, pressed && styles.dangerPressed]}
          onPress={confirmReset}>
          <Text style={styles.dangerText}>🗑️ Reset Progress</Text>
        </Pressable>

        <View style={styles.about}>
          <Text style={styles.aboutTitle}>Candy Kingdom Crush</Text>
          <Text style={styles.aboutText}>Version 1.0.0 · Fully offline</Text>
        </View>
      </SafeAreaView>
    </AppBackground>
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
  container: {flex: 1, paddingHorizontal: spacing.lg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  headerSide: {flex: 1},
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.85)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: palette.panel,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: palette.panelLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadow,
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
    backgroundColor: palette.danger,
    borderColor: '#FFB3BC',
    borderWidth: 2,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadow,
  },
  dangerPressed: {transform: [{scale: 0.97}], opacity: 0.9},
  dangerText: {color: '#FFFFFF', fontSize: 16, fontWeight: '900'},
  about: {
    marginTop: 'auto',
    marginBottom: spacing.xl,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: palette.panelLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  aboutTitle: {color: palette.text, fontWeight: '800', fontSize: 15},
  aboutText: {
    color: palette.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});
