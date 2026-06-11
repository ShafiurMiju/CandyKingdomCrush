/** Dimmed full-screen backdrop with a centered card that pops in. */

import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {palette, radius, shadow, spacing} from '../constants/theme';

export default function OverlayContainer({children}: {children: React.ReactNode}) {
  const scale = useSharedValue(0.7);
  const fade = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(1, {duration: 200});
    scale.value = withSpring(1, {damping: 11, stiffness: 140});
  }, [fade, scale]);

  const backdrop = useAnimatedStyle(() => ({opacity: fade.value}));
  const card = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{scale: scale.value}],
  }));

  return (
    <Animated.View style={[styles.backdrop, backdrop]}>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, card]}>{children}</Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay,
    zIndex: 20,
  },
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg},
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.panel,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.panelLight,
    ...shadow,
  },
});
