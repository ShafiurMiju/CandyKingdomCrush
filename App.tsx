/**
 * Candy Kingdom Crush
 * An offline Match-3 puzzle game built with React Native CLI + TypeScript.
 *
 * @format
 */

import React, {useEffect} from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import {useProgressStore} from './src/store/progressStore';
import {useSettingsStore} from './src/store/settingsStore';
import {AudioService} from './src/services/audio';

function App(): React.JSX.Element {
  const hydrateProgress = useProgressStore(state => state.hydrate);
  const hydrateSettings = useSettingsStore(state => state.hydrate);

  // Load persisted progress + settings on cold start.
  useEffect(() => {
    hydrateProgress();
    hydrateSettings();
    AudioService.init();
    return () => {
      AudioService.dispose();
    };
  }, [hydrateProgress, hydrateSettings]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#3A1078" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
