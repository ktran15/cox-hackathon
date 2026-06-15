// Gamification — Section 8.3, rebuilt on real metrics. Progression is two
// ascending milestone ladders (Water + CO₂); the plant grows from the COMBINED
// count of milestones reached across both. Badge evaluation is unchanged and
// still hangs off the real totals + route counts. Pure, fully unit-tested.

import { BADGES, type BadgeId } from './constants';
import type { MilestoneProgress, Route } from './types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Progress along one ascending milestone ladder. `reached` is the current
 * level on that track; `nextThreshold` is the goal to aim for (null once the
 * ladder is maxed); `fraction` fills from the previous threshold toward the
 * next so a progress bar advances within each band. The ladder MUST be sorted
 * ascending (constants.ts owns the values).
 */
export function milestoneProgress(
  value: number,
  ladder: readonly number[],
): MilestoneProgress {
  const current = Math.max(0, value);
  let reached = 0;
  for (const threshold of ladder) {
    if (current >= threshold) reached += 1;
    else break;
  }
  const maxed = reached >= ladder.length;
  const prevThreshold = reached > 0 ? ladder[reached - 1] : 0;
  const nextThreshold = maxed ? null : ladder[reached];
  const toNext = nextThreshold === null ? 0 : round2(nextThreshold - current);
  const span = nextThreshold === null ? 0 : nextThreshold - prevThreshold;
  const fraction =
    nextThreshold === null
      ? 1
      : Math.min(1, Math.max(0, (current - prevThreshold) / span));
  return { reached, current, prevThreshold, nextThreshold, toNext, fraction };
}

/** The plant's top growth stage (LevelPlant supports 1..6, blooming at 6). */
export const PLANT_MAX_STAGE = 6;

/**
 * Maps the COMBINED milestone count across both ladders to the LevelPlant's
 * growth stage. Hitting a milestone on EITHER track advances the plant one
 * step; it caps at PLANT_MAX_STAGE (full bloom).
 */
export function plantStage(milestonesReached: number): number {
  return Math.min(PLANT_MAX_STAGE, 1 + Math.max(0, milestonesReached));
}

// SPEC-NOTE: the local_giver badge ("Donate to a high-reuse local spot")
// needs to know WHERE a donation went, which is not part of ProfileStats
// (Section 9). BadgeStats therefore adds an optional donatedHighReuse flag
// the caller derives when routing (Milestone 3+). ProfileStats structurally
// satisfies the rest of this interface, so selectors can pass it directly.
export interface BadgeStats {
  totalGarments: number;
  byRoute: Record<Route, number>;
  totalWaterL: number;
  totalCo2Kg: number;
  donatedHighReuse?: boolean;
}

const criteria: Record<BadgeId, (s: BadgeStats) => boolean> = {
  first_loop: (s) => s.totalGarments >= 1,
  closet_5: (s) => s.totalGarments >= 5,
  rehomer_10: (s) => s.totalGarments >= 10,
  champion_25: (s) => s.totalGarments >= 25,
  resell_10: (s) => s.byRoute.resell >= 10,
  donate_10: (s) => s.byRoute.donate >= 10,
  recycle_5: (s) => s.byRoute.recycle >= 5,
  local_giver: (s) => s.donatedHighReuse === true,
  water_1k: (s) => s.totalWaterL >= 1000,
  water_10k: (s) => s.totalWaterL >= 10000,
  co2_10: (s) => s.totalCo2Kg >= 10,
  co2_50: (s) => s.totalCo2Kg >= 50,
};

/**
 * Returns ONLY newly earned badge ids — anything already in earnedIds is
 * never returned again, so badges can't double-award. The caller persists
 * the result (badgeStore) and celebrates it.
 */
export function evaluateBadges(stats: BadgeStats, earnedIds: readonly string[]): BadgeId[] {
  const earned = new Set(earnedIds);
  return BADGES.filter((badge) => !earned.has(badge.id) && criteria[badge.id](stats)).map(
    (badge) => badge.id,
  );
}
