import { BASELINE, DISPLACEMENT, QUALITY_BONUS, ROUTE_FACTOR } from '../constants';
import { computeSaving, garmentLifetime } from '../impact';
import type { Garment, GarmentType, Grade, PassportEvent, Route } from '../types';

const ALL_TYPES: GarmentType[] = [
  'onesie',
  'top',
  'pants',
  'dress',
  'jacket',
  'sleepwear',
  'accessory',
  'unknown',
];
const ALL_ROUTES: Route[] = ['resell', 'donate', 'recycle'];
const ALL_GRADES: Grade[] = ['A', 'B', 'C', 'D'];

describe('computeSaving — golden values (hand-computed from Section 8.2)', () => {
  // Each case pins exact output, anchoring the formula, the rounding rules,
  // and the bonus gating against hand-verified numbers.
  it.each([
    // type, route, grade, waterL, co2Kg, divertedKg
    // bonus applies: resell + A → 1200*0.7*1.05 = 882
    ['onesie', 'resell', 'A', 882, 1.1, 0.1],
    // same grade A but donated → NO bonus: 1200*0.7 = 840
    ['onesie', 'donate', 'A', 840, 1.05, 0.1],
    // half-up rounding on water: 1500*0.7*1.05 = 1102.5 → 1103
    ['top', 'resell', 'B', 1103, 1.47, 0.12],
    // resell WITHOUT bonus (grade C): 1500*0.7 = 1050
    ['top', 'resell', 'C', 1050, 1.4, 0.12],
    ['pants', 'donate', 'B', 1750, 2.1, 0.2],
    // recycle factor 0.15: 1400*0.15*0.7 = 147
    ['sleepwear', 'recycle', 'D', 147, 0.19, 0.15],
    // smallest garment through recycle: 400*0.15*0.7 = 42
    ['accessory', 'recycle', 'D', 42, 0.05, 0.05],
    // unknown type falls back to its own baseline row
    ['unknown', 'donate', 'D', 1050, 1.4, 0.15],
  ] as [GarmentType, Route, Grade, number, number, number][])(
    '%s / %s / grade %s → %i L, %f kg CO₂, %f kg diverted',
    (type, route, grade, waterL, co2Kg, divertedKg) => {
      expect(computeSaving(type, route, grade)).toEqual({
        waterL,
        co2Kg,
        divertedKg,
      });
    },
  );
});

describe('computeSaving — full type × route × grade matrix', () => {
  it.each(ALL_TYPES)('covers every route and grade for %s', (type) => {
    for (const route of ALL_ROUTES) {
      for (const grade of ALL_GRADES) {
        const s = computeSaving(type, route, grade);
        // Always positive, never NaN.
        expect(s.waterL).toBeGreaterThan(0);
        expect(s.co2Kg).toBeGreaterThan(0);
        expect(Number.isInteger(s.waterL)).toBe(true);
        // co2 carries at most 2 decimals.
        expect(s.co2Kg).toBeCloseTo(Math.round(s.co2Kg * 100) / 100, 10);
        // divertedKg is the garment's physical weight, independent of route/grade.
        expect(s.divertedKg).toBe(BASELINE[type].weightKg);
        // No stray fields — the Saving shape is exactly the three real metrics.
        expect(Object.keys(s).sort()).toEqual(['co2Kg', 'divertedKg', 'waterL']);
      }
    }
  });

  it.each(ALL_TYPES)('applies the quality bonus only to A/B resell for %s', (type) => {
    // A and B resell are identical (both get the bonus)…
    expect(computeSaving(type, 'resell', 'A')).toEqual(computeSaving(type, 'resell', 'B'));
    // …C and D resell are identical (neither gets it)…
    expect(computeSaving(type, 'resell', 'C')).toEqual(computeSaving(type, 'resell', 'D'));
    // …and the bonus strictly increases water saved over no-bonus resell.
    expect(computeSaving(type, 'resell', 'A').waterL).toBeGreaterThan(
      computeSaving(type, 'resell', 'C').waterL,
    );
    // Grade never matters off resell.
    expect(computeSaving(type, 'donate', 'A')).toEqual(computeSaving(type, 'donate', 'D'));
    expect(computeSaving(type, 'recycle', 'A')).toEqual(computeSaving(type, 'recycle', 'D'));
  });

  it.each(ALL_TYPES)('matches the Section 8.2 formula for %s', (type) => {
    const base = BASELINE[type];
    // No-bonus reuse routes: factor 1 → base * DISPLACEMENT.
    expect(computeSaving(type, 'donate', 'A').waterL).toBe(
      Math.round(base.waterL * DISPLACEMENT),
    );
    // Bonus resell: base * DISPLACEMENT * QUALITY_BONUS.
    expect(computeSaving(type, 'resell', 'B').waterL).toBe(
      Math.round(base.waterL * DISPLACEMENT * QUALITY_BONUS),
    );
    // Recycle: base * 0.15 * DISPLACEMENT (same operation order as the engine).
    expect(computeSaving(type, 'recycle', 'D').waterL).toBe(
      Math.round(base.waterL * ROUTE_FACTOR.recycle * DISPLACEMENT),
    );
    // Recycle saves far less than reuse, but never zero.
    expect(computeSaving(type, 'recycle', 'D').waterL).toBeLessThan(
      computeSaving(type, 'donate', 'D').waterL,
    );
  });
});

function event(id: string, grade: Grade, route: Route, type: GarmentType): PassportEvent {
  return {
    id,
    at: '2026-06-12T00:00:00.000Z',
    grade,
    route,
    saving: computeSaving(type, route, grade),
  };
}

describe('garmentLifetime', () => {
  it('returns all zeros for an unrouted garment (no events)', () => {
    expect(garmentLifetime([])).toEqual({
      waterL: 0,
      co2Kg: 0,
      divertedKg: 0,
    });
  });

  it('equals the single saving for one event', () => {
    const e = event('e1', 'A', 'resell', 'onesie');
    expect(garmentLifetime([e])).toEqual(e.saving);
  });

  it('sums savings across multiple loops (multi-loop ready)', () => {
    const events = [
      event('e1', 'A', 'resell', 'onesie'), // 882 L, 1.1 kg, 0.1 kg
      event('e2', 'D', 'recycle', 'sleepwear'), // 147 L, 0.19 kg, 0.15 kg
      event('e3', 'D', 'recycle', 'accessory'), // 42 L, 0.05 kg, 0.05 kg
    ];
    expect(garmentLifetime(events)).toEqual({
      waterL: 1071,
      co2Kg: 1.34, // 1.1 + 0.19 + 0.05 — must not drift to 1.3399999…
      divertedKg: 0.3, // 0.1 + 0.15 + 0.05 — must not drift to 0.30000000…4
    });
  });
});

describe('purity', () => {
  it('returns a fresh Saving object every call (no shared state)', () => {
    const a = computeSaving('top', 'donate', 'B');
    const b = computeSaving('top', 'donate', 'B');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('does not mutate the events it sums', () => {
    const e = event('e1', 'B', 'donate', 'pants');
    const frozen: Garment['passport'] = [Object.freeze(e) as PassportEvent];
    expect(() => garmentLifetime(frozen)).not.toThrow();
  });
});
