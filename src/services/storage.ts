/**
 * Offline persistence built on AsyncStorage. All game state (progress, best
 * scores, stars, settings) is stored locally as JSON — there is no backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  progress: '@candykingdom/progress',
  settings: '@candykingdom/settings',
} as const;

/** Reads a JSON value, returning `fallback` if missing or corrupt. */
export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storage] failed to load "${key}"`, err);
    return fallback;
  }
}

/** Writes a JSON value. Failures are logged but never thrown. */
export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] failed to save "${key}"`, err);
  }
}

/** Wipes all saved game data (used by "Reset progress" in settings). */
export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([StorageKeys.progress, StorageKeys.settings]);
  } catch (err) {
    console.warn('[storage] failed to clear', err);
  }
}
