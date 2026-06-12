/**
 * AppBackground
 * -------------
 * Full-screen candy-kingdom artwork shared by every screen, with a translucent
 * WHITE scrim on top that brightens the image (rather than the old purple
 * scrim) so the light theme reads cleanly and dark text/UI keep contrast.
 * The artwork ships as an optimised JPEG (candykingdom.png is the source).
 */

import React from 'react';
import {ImageBackground, StyleSheet, View} from 'react-native';

interface AppBackgroundProps {
  children: React.ReactNode;
  /** White-scrim strength 0..1 — higher washes the artwork brighter (default 0.5). */
  dim?: number;
}

export default function AppBackground({
  children,
  dim = 0.01,
}: AppBackgroundProps) {
  const scrimColor = {backgroundColor: `rgba(255, 255, 255, ${dim})`};
  return (
    <ImageBackground
      source={require('../assets/images/candykingdom.jpg')}
      style={styles.bg}
      resizeMode="cover">
      <View style={[styles.scrim, scrimColor]} />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
});
