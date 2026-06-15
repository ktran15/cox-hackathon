// Closet store (Section 10) — the single source of truth for garments and the
// ONLY thing the profile totals are derived from (Section 4 state-integrity
// rule). Persisted via AsyncStorage. Routing reuses the pure domain math
// (computeSaving / garmentLifetime); no impact arithmetic lives here.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { computeSaving, garmentLifetime } from '../../domain/impact';
import type { Defect, Garment, GarmentType, Grade, PassportEvent, Route } from '../../domain/types';
import { uid } from '../../utils/uid';
import { asyncJSONStorage, noopMigrate, PERSIST_VERSION } from '../persistence';

/** Fields a freshly scanned (not-yet-routed) garment is created from. */
export interface NewGarmentInput {
  imageUri: string;
  type: GarmentType;
  grade: Grade;
  defects: Defect[];
  nickname?: string;
}

export interface ClosetState {
  garments: Garment[];
  /** Adds a saved-but-unrouted garment and returns it (UI needs the new id). */
  addGarment: (input: NewGarmentInput) => Garment;
  /** Shallow-patches a garment (e.g. nickname, tagId). */
  updateGarment: (id: string, patch: Partial<Garment>) => void;
  /**
   * Routes a garment: computes the saving from the pure domain layer, appends
   * a PassportEvent, and refreshes the garment's lifetime saving. Designed to
   * grow — a garment can accrue more events later (multi-loop ready).
   */
  routeGarment: (id: string, route: Route) => void;
  /**
   * Permanently removes a garment. Because all profile totals/milestones are
   * DERIVED from the closet (Section 4 state-integrity rule), removing the
   * garment here automatically subtracts its saving from every total — nothing
   * else to update, nothing stored to go stale.
   */
  removeGarment: (id: string) => void;
  getById: (id: string) => Garment | undefined;
  /** Clears the closet (used by tests; no UI affordance). */
  reset: () => void;
}

export const useClosetStore = create<ClosetState>()(
  persist(
    (set, get) => ({
      garments: [],

      addGarment: (input) => {
        const garment: Garment = {
          id: uid(),
          createdAt: new Date().toISOString(),
          imageUri: input.imageUri,
          type: input.type,
          grade: input.grade,
          defects: input.defects,
          nickname: input.nickname,
          passport: [], // empty until routed; contributes no saving yet
        };
        set((state) => ({ garments: [garment, ...state.garments] }));
        return garment;
      },

      updateGarment: (id, patch) => {
        set((state) => ({
          garments: state.garments.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
      },

      routeGarment: (id, route) => {
        set((state) => ({
          garments: state.garments.map((g) => {
            if (g.id !== id) return g;
            const saving = computeSaving(g.type, route, g.grade);
            const event: PassportEvent = {
              id: uid(),
              at: new Date().toISOString(),
              grade: g.grade,
              route,
              saving,
            };
            const passport = [...g.passport, event];
            return {
              ...g,
              route,
              // Lifetime saving across every event — equals this one event today.
              saving: garmentLifetime(passport),
              passport,
            };
          }),
        }));
      },

      removeGarment: (id) => {
        set((state) => ({ garments: state.garments.filter((g) => g.id !== id) }));
      },

      getById: (id) => get().garments.find((g) => g.id === id),

      reset: () => set({ garments: [] }),
    }),
    {
      name: 'handmeup-closet',
      storage: asyncJSONStorage,
      version: PERSIST_VERSION,
      migrate: noopMigrate,
      partialize: (state) => ({ garments: state.garments }),
    },
  ),
);
