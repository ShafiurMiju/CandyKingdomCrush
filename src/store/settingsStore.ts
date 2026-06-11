/**
 * Settings store: sound/music toggles, persisted to AsyncStorage and mirrored to
 * the AudioService.
 */

import {create} from 'zustand';
import {AudioService} from '../services/audio';
import {StorageKeys, loadJSON, saveJSON} from '../services/storage';

interface PersistedSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

interface SettingsState extends PersistedSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSound: (enabled: boolean) => void;
  setMusic: (enabled: boolean) => void;
  reset: () => Promise<void>;
}

const DEFAULTS: PersistedSettings = {
  soundEnabled: true,
  musicEnabled: true,
};

function persist(state: PersistedSettings) {
  void saveJSON<PersistedSettings>(StorageKeys.settings, {
    soundEnabled: state.soundEnabled,
    musicEnabled: state.musicEnabled,
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    const saved = await loadJSON<PersistedSettings>(StorageKeys.settings, DEFAULTS);
    AudioService.setSoundEnabled(saved.soundEnabled);
    AudioService.setMusicEnabled(saved.musicEnabled);
    set({...saved, hydrated: true});
  },

  setSound: enabled => {
    AudioService.setSoundEnabled(enabled);
    set({soundEnabled: enabled});
    persist({...get(), soundEnabled: enabled});
  },

  setMusic: enabled => {
    AudioService.setMusicEnabled(enabled);
    set({musicEnabled: enabled});
    persist({...get(), musicEnabled: enabled});
  },

  reset: async () => {
    AudioService.setSoundEnabled(DEFAULTS.soundEnabled);
    AudioService.setMusicEnabled(DEFAULTS.musicEnabled);
    set({...DEFAULTS});
    await saveJSON(StorageKeys.settings, DEFAULTS);
  },
}));
