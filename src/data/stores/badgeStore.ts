// Badge store (Section 10) — persists ONLY earned badge unlocks
// (`{ id, earnedAt }`), because unlocks are events, not sums. Everything else
// (totals, level) is derived from the closet (Section 4 state-integrity rule),
// so it must NEVER be stored here. Badge math lives in the pure domain layer
// (evaluateBadges); this store just records what the domain says is newly
// earned and refuses to double-award.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { BadgeStats } from '../../domain/gamification';
import { evaluateBadges } from '../../domain/gamification';
import { asyncJSONStorage, noopMigrate, PERSIST_VERSION } from '../persistence';

export interface EarnedBadge {
  id: string;
  earnedAt: string; // ISO
}

export interface BadgeState {
  earned: EarnedBadge[];
  /**
   * Evaluates the badge criteria against current stats, persists any NEWLY
   * earned badges with a timestamp, and returns just those new ids so the UI
   * can celebrate them. Already-earned badges are passed to evaluateBadges as
   * the exclusion set, so this is safe to call repeatedly without re-awarding.
   */
  awardFromStats: (stats: BadgeStats) => string[];
  hasBadge: (id: string) => boolean;
  /** Clears earned badges (used by tests; no UI affordance). */
  reset: () => void;
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      earned: [],

      awardFromStats: (stats) => {
        const earnedIds = get().earned.map((b) => b.id);
        const newlyEarned = evaluateBadges(stats, earnedIds);
        if (newlyEarned.length === 0) return [];
        const earnedAt = new Date().toISOString();
        const additions: EarnedBadge[] = newlyEarned.map((id) => ({ id, earnedAt }));
        set((state) => ({ earned: [...state.earned, ...additions] }));
        return newlyEarned;
      },

      hasBadge: (id) => get().earned.some((b) => b.id === id),

      reset: () => set({ earned: [] }),
    }),
    {
      name: 'handmeup-badges',
      storage: asyncJSONStorage,
      version: PERSIST_VERSION,
      migrate: noopMigrate,
      partialize: (state) => ({ earned: state.earned }),
    },
  ),
);
