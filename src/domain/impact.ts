// Impact engine — Section 8.2. The saving for one event is the footprint of
// the new garment that didn't get made because this one was reused,
// discounted to stay conservative. Pure functions, fully unit-tested.

import { BASELINE, DISPLACEMENT, QUALITY_BONUS, ROUTE_FACTOR } from './constants';
import type { GarmentType, Grade, PassportEvent, Route, Saving } from './types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeSaving(type: GarmentType, route: Route, grade: Grade): Saving {
  const base = BASELINE[type];
  const factor = ROUTE_FACTOR[route];
  const bonus = route === 'resell' && (grade === 'A' || grade === 'B') ? QUALITY_BONUS : 1;
  const waterL = Math.round(base.waterL * factor * DISPLACEMENT * bonus);
  const co2Kg = round2(base.co2Kg * factor * DISPLACEMENT * bonus);
  const divertedKg = base.weightKg;
  return { waterL, co2Kg, divertedKg };
}

/**
 * Lifetime saving across all passport events (multi-loop ready; today a
 * garment has at most one). Sums are re-rounded so floating-point drift never
 * reaches the UI (1.1 + 0.19 + 0.05 must read 1.34, not 1.3399999…).
 */
export function garmentLifetime(events: readonly PassportEvent[]): Saving {
  let waterL = 0;
  let co2Kg = 0;
  let divertedKg = 0;
  for (const event of events) {
    waterL += event.saving.waterL;
    co2Kg += event.saving.co2Kg;
    divertedKg += event.saving.divertedKg;
  }
  return {
    waterL,
    co2Kg: round2(co2Kg),
    divertedKg: round2(divertedKg),
  };
}
