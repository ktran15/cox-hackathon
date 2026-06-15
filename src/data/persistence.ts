// Shared persistence wiring for the Zustand stores (Section 10). Every
// persisted store uses the same AsyncStorage-backed JSON adapter, the same
// schema version, and a no-op migrate so future shape changes never crash an
// old install (the migrate just hands the persisted state straight back).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Current persisted-shape version. Bump + extend `noopMigrate` when shapes change. */
export const PERSIST_VERSION = 1;

/** JSON storage backed by AsyncStorage, shared by all persisted stores. */
export const asyncJSONStorage = createJSONStorage(() => AsyncStorage);

/**
 * No-op migration: returns the persisted state unchanged. Versioned now so a
 * future change can branch on `from` without older installs crashing on boot.
 */
export function noopMigrate<T>(persistedState: unknown, _from: number): T {
  return persistedState as T;
}
