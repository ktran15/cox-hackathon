// Settings store (Section 10) — persisted accessibility + identity prefs. The
// text-size multiplier and reduce-motion toggle are read by the theme/text-size
// provider and the Celebration/count-up animations (Section 2). `hasOnboarded`
// gates the first-launch onboarding redirect (Section 7.1).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { asyncJSONStorage, noopMigrate, PERSIST_VERSION } from '../persistence';

export type TextSize = 'normal' | 'large' | 'xlarge';

export interface SettingsState {
  textSize: TextSize;
  reduceMotion: boolean;
  name?: string;
  hasOnboarded: boolean;
  setTextSize: (textSize: TextSize) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setName: (name: string | undefined) => void;
  setHasOnboarded: (hasOnboarded: boolean) => void;
  /** Restores defaults (used by tests; no UI affordance). */
  reset: () => void;
}

const DEFAULTS = {
  textSize: 'normal' as TextSize,
  reduceMotion: false,
  name: undefined as string | undefined,
  hasOnboarded: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setTextSize: (textSize) => set({ textSize }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setName: (name) => set({ name: name && name.trim().length > 0 ? name.trim() : undefined }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),

      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'handmeup-settings',
      storage: asyncJSONStorage,
      version: PERSIST_VERSION,
      migrate: noopMigrate,
      partialize: (state) => ({
        textSize: state.textSize,
        reduceMotion: state.reduceMotion,
        name: state.name,
        hasOnboarded: state.hasOnboarded,
      }),
    },
  ),
);
