// Domain constants — Section 8: impact baselines and factors (8.2), level
// thresholds and the badge catalogue (8.3). Pure data, no side effects.

import type { GarmentType, Route } from './types';

export interface GarmentBaseline {
  waterL: number;
  co2Kg: number;
  weightKg: number;
}

// Footprint to PRODUCE one new kids' garment = what reuse displaces.
// Estimates scaled from published adult-garment figures (see Sources,
// Section 13). Always presented to users as estimates, never measurements.
export const BASELINE = {
  onesie: { waterL: 1200, co2Kg: 1.5, weightKg: 0.1 },
  top: { waterL: 1500, co2Kg: 2.0, weightKg: 0.12 },
  pants: { waterL: 2500, co2Kg: 3.0, weightKg: 0.2 },
  dress: { waterL: 2700, co2Kg: 3.2, weightKg: 0.18 },
  jacket: { waterL: 4000, co2Kg: 5.0, weightKg: 0.4 },
  sleepwear: { waterL: 1400, co2Kg: 1.8, weightKg: 0.15 },
  accessory: { waterL: 400, co2Kg: 0.5, weightKg: 0.05 },
  unknown: { waterL: 1500, co2Kg: 2.0, weightKg: 0.15 },
} as const satisfies Record<GarmentType, GarmentBaseline>;

export const ROUTE_FACTOR = {
  resell: 1.0,
  donate: 1.0,
  recycle: 0.15,
} as const satisfies Record<Route, number>;

/** Conservative: not every reuse replaces a new purchase. */
export const DISPLACEMENT = 0.7;

/** Only when grade A/B is resold. */
export const QUALITY_BONUS = 1.05;

// Progression (8.3, rebuilt on real metrics) — two ascending milestone ladders
// keyed to the two things the impact engine actually produces: litres of water
// and kilograms of CO₂ saved. There is no points abstraction anymore; the
// plant grows from the COMBINED count of milestones reached across both ladders
// (see gamification.ts). Values are sized for children's-garment savings.
export const WATER_MILESTONES: readonly number[] = [500, 2_000, 10_000, 50_000];
export const CO2_MILESTONES: readonly number[] = [1, 5, 25, 100];

// Badges (8.3) — earned by COMPLETING a route, never by scanning alone.
// Criteria live in gamification.ts; this is the catalogue the UI renders.
export const BADGES = [
  { id: 'first_loop', title: 'First Loop', howToEarn: 'Route your first garment' },
  { id: 'closet_5', title: 'Closet Starter', howToEarn: 'Route 5 garments' },
  { id: 'rehomer_10', title: 'Rehomer', howToEarn: 'Route 10 garments' },
  { id: 'champion_25', title: 'Circular Champion', howToEarn: 'Route 25 garments' },
  { id: 'resell_10', title: 'Resell Pro', howToEarn: 'Resell 10 items' },
  { id: 'donate_10', title: 'Big Heart', howToEarn: 'Donate 10 items' },
  { id: 'recycle_5', title: 'Fiber Saver', howToEarn: 'Recycle 5 worn-out items' },
  { id: 'local_giver', title: 'Local Giver', howToEarn: 'Donate to a high-reuse local spot' },
  { id: 'water_1k', title: 'Water Guardian', howToEarn: 'Save 1,000 L total' },
  { id: 'water_10k', title: 'Hydro Hero', howToEarn: 'Save 10,000 L total' },
  { id: 'co2_10', title: 'Carbon Cutter', howToEarn: 'Save 10 kg CO₂ total' },
  { id: 'co2_50', title: 'Climate Kid', howToEarn: 'Save 50 kg CO₂ total' },
] as const;

export type BadgeId = (typeof BADGES)[number]['id'];
