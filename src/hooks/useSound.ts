/**
 * Thin hook over the AudioService. The service already respects the persisted
 * sound/music settings, so this is just a stable convenience wrapper.
 */

import {useMemo} from 'react';
import {AudioService, MusicTrack, SoundEffect} from '../services/audio';

export function useSound() {
  return useMemo(
    () => ({
      play: (effect: SoundEffect) => AudioService.playEffect(effect),
      playMusic: (track: MusicTrack) => AudioService.playMusic(track),
      stopMusic: () => AudioService.stopMusic(),
    }),
    [],
  );
}
