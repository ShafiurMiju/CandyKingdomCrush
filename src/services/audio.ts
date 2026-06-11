/**
 * AudioService
 * ------------
 * A thin, dependency-free audio facade. The game ships WITHOUT a native sound
 * library so it stays fully offline and installs cleanly; every play call is a
 * no-op placeholder that simply logs in __DEV__.
 *
 * To add real audio later:
 *   1. `npm i react-native-sound` (or react-native-track-player)
 *   2. Drop audio files into `src/assets/sounds/`
 *   3. Implement `load()` / `playEffect()` / `playMusic()` below.
 *
 * The public API is intentionally stable so the rest of the app never changes.
 */

export type SoundEffect = 'match' | 'combo' | 'special' | 'swap' | 'invalid';
export type MusicTrack = 'menu' | 'game' | 'win' | 'lose';

/** File names the assets are expected to use once real audio is wired up. */
export const SOUND_FILES: Record<SoundEffect, string> = {
  match: 'match.mp3',
  combo: 'combo.mp3',
  special: 'special.mp3',
  swap: 'swap.mp3',
  invalid: 'invalid.mp3',
};

export const MUSIC_FILES: Record<MusicTrack, string> = {
  menu: 'bgm_menu.mp3',
  game: 'bgm_game.mp3',
  win: 'win.mp3',
  lose: 'lose.mp3',
};

class AudioServiceImpl {
  private soundEnabled = true;
  private musicEnabled = true;
  private currentTrack: MusicTrack | null = null;
  private initialised = false;

  init(): void {
    if (this.initialised) {
      return;
    }
    this.initialised = true;
    // Placeholder: pre-load native sound handles here.
    this.log('initialised (placeholder audio)');
  }

  dispose(): void {
    this.stopMusic();
    this.initialised = false;
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else if (this.currentTrack) {
      this.playMusic(this.currentTrack);
    }
  }

  /** Plays a one-shot sound effect. */
  playEffect(effect: SoundEffect): void {
    if (!this.soundEnabled) {
      return;
    }
    this.log(`sfx: ${effect} (${SOUND_FILES[effect]})`);
    // Placeholder: trigger native playback here.
  }

  /** Starts/loops a background music track. */
  playMusic(track: MusicTrack): void {
    this.currentTrack = track;
    if (!this.musicEnabled) {
      return;
    }
    this.log(`music: ${track} (${MUSIC_FILES[track]})`);
    // Placeholder: start native looped playback here.
  }

  stopMusic(): void {
    this.log('music: stop');
    // Placeholder: stop native playback here.
  }

  private log(msg: string): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[audio] ${msg}`);
    }
  }
}

export const AudioService = new AudioServiceImpl();
