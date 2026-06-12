/**
 * AudioService
 * ------------
 * Real audio playback via react-native-sound. Effects are pre-loaded at init
 * for low-latency one-shots; music tracks are loaded lazily and cached. BGM
 * tracks loop forever, win/lose stingers play once. All assets are generated
 * WAVs (see scripts/generate_sounds.py) bundled natively on both platforms:
 * Android in res/raw, iOS in the app bundle resources.
 *
 * The public API is intentionally stable so the rest of the app never changes.
 */

import Sound from 'react-native-sound';

export type SoundEffect = 'match' | 'combo' | 'special' | 'swap' | 'invalid';
export type MusicTrack = 'menu' | 'game' | 'win' | 'lose';

export const SOUND_FILES: Record<SoundEffect, string> = {
  match: 'match.wav',
  combo: 'combo.wav',
  special: 'special.wav',
  swap: 'swap.wav',
  invalid: 'invalid.wav',
};

export const MUSIC_FILES: Record<MusicTrack, string> = {
  menu: 'bgm_menu.wav',
  game: 'bgm_game.wav',
  win: 'win.wav',
  lose: 'lose.wav',
};

/** Tracks that loop forever (stingers like win/lose play once). */
const LOOPING_TRACKS: ReadonlySet<MusicTrack> = new Set(['menu', 'game']);

const EFFECT_VOLUME = 0.9;
const MUSIC_VOLUME = 0.45;
const STINGER_VOLUME = 0.8;

class AudioServiceImpl {
  private soundEnabled = true;
  private musicEnabled = true;
  private currentTrack: MusicTrack | null = null;
  private initialised = false;

  private effects = new Map<SoundEffect, Sound>();
  private music = new Map<MusicTrack, Sound>();
  private playingTrack: MusicTrack | null = null;

  init(): void {
    if (this.initialised) {
      return;
    }
    this.initialised = true;

    // Mix with other apps' audio and respect the iOS silent switch.
    Sound.setCategory('Ambient', true);

    // Pre-load every effect for low-latency playback.
    (Object.keys(SOUND_FILES) as SoundEffect[]).forEach(effect => {
      const sound = new Sound(SOUND_FILES[effect], Sound.MAIN_BUNDLE, error => {
        if (error) {
          this.log(`failed to load ${SOUND_FILES[effect]}: ${error.message}`);
          this.effects.delete(effect);
          return;
        }
        sound.setVolume(EFFECT_VOLUME);
      });
      this.effects.set(effect, sound);
    });
    this.log('initialised');
  }

  dispose(): void {
    this.stopMusic();
    this.effects.forEach(sound => sound.release());
    this.effects.clear();
    this.music.forEach(sound => sound.release());
    this.music.clear();
    this.initialised = false;
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopPlayback();
    } else if (this.currentTrack) {
      this.playMusic(this.currentTrack);
    }
  }

  /** Plays a one-shot sound effect. */
  playEffect(effect: SoundEffect): void {
    if (!this.soundEnabled) {
      return;
    }
    const sound = this.effects.get(effect);
    if (!sound || !sound.isLoaded()) {
      return;
    }
    // Restart from the top so rapid repeats always fire.
    sound.stop(() => sound.play());
  }

  /** Starts a music track: BGM loops forever, win/lose stingers play once. */
  playMusic(track: MusicTrack): void {
    this.currentTrack = track;
    if (!this.musicEnabled) {
      return;
    }
    if (this.playingTrack === track) {
      return;
    }
    this.stopPlayback();
    this.playingTrack = track;

    const cached = this.music.get(track);
    if (cached) {
      this.startTrack(track, cached);
      return;
    }
    const sound = new Sound(MUSIC_FILES[track], Sound.MAIN_BUNDLE, error => {
      if (error) {
        this.log(`failed to load ${MUSIC_FILES[track]}: ${error.message}`);
        this.music.delete(track);
        if (this.playingTrack === track) {
          this.playingTrack = null;
        }
        return;
      }
      // Only start if this track is still the one we want.
      if (this.playingTrack === track) {
        this.startTrack(track, sound);
      }
    });
    this.music.set(track, sound);
  }

  stopMusic(): void {
    this.currentTrack = null;
    this.stopPlayback();
  }

  private startTrack(track: MusicTrack, sound: Sound): void {
    const looping = LOOPING_TRACKS.has(track);
    sound.setNumberOfLoops(looping ? -1 : 0);
    sound.setVolume(looping ? MUSIC_VOLUME : STINGER_VOLUME);
    sound.setCurrentTime(0);
    sound.play(() => {
      if (!looping && this.playingTrack === track) {
        this.playingTrack = null;
      }
    });
  }

  /** Stops whatever music/stinger is audible without forgetting the track. */
  private stopPlayback(): void {
    if (this.playingTrack) {
      const sound = this.music.get(this.playingTrack);
      sound?.stop();
      this.playingTrack = null;
    }
  }

  private log(msg: string): void {
    if (__DEV__) {
      console.log(`[audio] ${msg}`);
    }
  }
}

export const AudioService = new AudioServiceImpl();
