// Profile selectors (Section 10) — derive ALL profile totals from the closet.
// This is the enforcement point for the state-integrity rule (Section 4):
// totals are NEVER stored; they are summed from garments every time. Reuses the
// pure domain math (garmentLifetime / levelFor) so the numbers can never drift
// from what the impact engine produced.
import { CO2_MILESTONES, WATER_MILESTONES } from '../../domain/constants';
import { milestoneProgress, plantStage, type BadgeStats } from '../../domain/gamification';
import { garmentLifetime } from '../../domain/impact';
import type { Garment, ProfileStats, Route } from '../../domain/types';

/** A garment counts toward totals only once it has been routed (Section 7.5). */
function isRouted(g: Garment): boolean {
  return g.route !== undefined && g.passport.length > 0;
}

/**
 * Derives the full ProfileStats from the closet. Unrouted garments have an
 * empty passport, so they contribute exactly zero to every total — the saved
 * "Just save for now" items show up nowhere until they're routed.
 */
export function getProfileStats(garments: readonly Garment[]): ProfileStats {
  const routed = garments.filter(isRouted);

  // Sum every passport event in one pass via the domain helper so rounding
  // matches the per-garment numbers and never accrues floating-point drift.
  const allEvents = routed.flatMap((g) => g.passport);
  const totals = garmentLifetime(allEvents);

  const byRoute: Record<Route, number> = { resell: 0, donate: 0, recycle: 0 };
  for (const g of routed) {
    if (g.route) byRoute[g.route] += 1;
  }

  // Progression now reads the two real metrics directly (Section 8.3). The
  // plant grows from milestones reached across BOTH ladders combined.
  const water = milestoneProgress(totals.waterL, WATER_MILESTONES);
  const co2 = milestoneProgress(totals.co2Kg, CO2_MILESTONES);
  const milestonesReached = water.reached + co2.reached;

  return {
    totalGarments: routed.length,
    totalWaterL: totals.waterL,
    totalCo2Kg: totals.co2Kg,
    totalDivertedKg: totals.divertedKg,
    byRoute,
    water,
    co2,
    milestonesReached,
    plantStage: plantStage(milestonesReached),
  };
}

/**
 * Builds the BadgeStats the domain's evaluateBadges expects. ProfileStats
 * already carries everything except `donatedHighReuse` — that flag isn't
 * derivable from a stored garment (a garment doesn't record which spot it went
 * to), so the caller supplies it at routing time from the chosen place
 * (Section 7.6 / the Milestone-2 SPEC-NOTE seam in gamification.ts).
 */
export function getBadgeStats(
  garments: readonly Garment[],
  donatedHighReuse?: boolean,
): BadgeStats {
  const stats = getProfileStats(garments);
  return {
    totalGarments: stats.totalGarments,
    byRoute: stats.byRoute,
    totalWaterL: stats.totalWaterL,
    totalCo2Kg: stats.totalCo2Kg,
    donatedHighReuse,
  };
}
