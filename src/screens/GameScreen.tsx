import React, {useCallback, useEffect} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Board from '../components/Board';
import ComboToast from '../components/ComboToast';
import GameHUD from '../components/GameHUD';
import LoseOverlay from '../components/LoseOverlay';
import PauseOverlay from '../components/PauseOverlay';
import WinOverlay from '../components/WinOverlay';
import {palette} from '../constants/theme';
import {useGameBoard} from '../hooks/useGameBoard';
import {useSound} from '../hooks/useSound';
import {getLevel, nextLevelId} from '../levels';
import {useGameStore} from '../store/gameStore';
import {ScreenProps} from '../navigation/types';

export default function GameScreen({navigation, route}: ScreenProps<'Game'>) {
  const {levelId} = route.params;
  const status = useGameStore(s => s.status);
  const startLevel = useGameStore(s => s.startLevel);
  const pause = useGameStore(s => s.pause);
  const resume = useGameStore(s => s.resume);
  const reset = useGameStore(s => s.reset);
  const sound = useSound();

  const {onSwipe, invalidNonce} = useGameBoard();

  // (Re)start whenever the target level changes.
  useEffect(() => {
    const level = getLevel(levelId);
    if (!level) {
      navigation.goBack();
      return;
    }
    startLevel(level);
  }, [levelId, startLevel, navigation]);

  useFocusEffect(
    useCallback(() => {
      sound.playMusic('game');
      return () => {};
    }, [sound]),
  );

  // Hardware back: pause while playing instead of leaving mid-game.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (useGameStore.getState().status === 'playing') {
          pause();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [pause]),
  );

  const restart = useCallback(() => {
    const level = getLevel(levelId);
    if (level) {
      startLevel(level);
    }
  }, [levelId, startLevel]);

  const goToLevels = useCallback(() => {
    reset();
    navigation.navigate('LevelSelect');
  }, [navigation, reset]);

  const next = nextLevelId(levelId);
  const goNext = useCallback(() => {
    if (next != null) {
      navigation.replace('Game', {levelId: next});
    }
  }, [navigation, next]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GameHUD onPause={pause} />

      <View style={styles.boardWrap}>
        <Board onSwipe={onSwipe} invalidNonce={invalidNonce} />
      </View>

      <ComboToast />

      {status === 'paused' && (
        <PauseOverlay
          onResume={resume}
          onRestart={restart}
          onHome={goToLevels}
        />
      )}
      {status === 'won' && (
        <WinOverlay
          onNext={next != null ? goNext : null}
          onReplay={restart}
          onHome={goToLevels}
        />
      )}
      {status === 'lost' && (
        <LoseOverlay onRetry={restart} onHome={goToLevels} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bgTop,
  },
  boardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
