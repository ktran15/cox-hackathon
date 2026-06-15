import { CO2_MILESTONES, WATER_MILESTONES } from '../../../domain/constants';
import { milestoneProgress, plantStage } from '../../../domain/gamification';
import { computeSaving, garmentLifetime } from '../../../domain/impact';
import type { Garment, PassportEvent, Route } from '../../../domain/types';
import { uid } from '../../../utils/uid';
import { getBadgeStats, getProfileStats } from '../profileSelectors';

// Build a garment in the shape the closet store produces. `route: undefined`
// with an empty passport models a saved-but-not-routed garment.
function makeGarment(opts: {
  type: Garment['type'];
  grade: Garment['grade'];
  route?: Route;
}): Garment {
  const base: Garment = {
    id: uid(),
    createdAt: new Date().toISOString(),
    imageUri: 'file://x.jpg',
    type: opts.type,
    grade: opts.grade,
    defects: [],
    passport: [],
  };
  if (!opts.route) return base;

  const saving = computeSaving(opts.type, opts.route, opts.grade);
  const event: PassportEvent = {
    id: uid(),
    at: new Date().toISOString(),
    grade: opts.grade,
    route: opts.route,
    saving,
  };
  return { ...base, route: opts.route, saving, passport: [event] };
}

describe('getProfileStats — derives totals from the closet (state-integrity rule)', () => {
  it('an empty closet yields all-zero stats with an unstarted plant (stage 1)', () => {
    const stats = getProfileStats([]);
    expect(stats).toEqual({
      totalGarments: 0,
      totalWaterL: 0,
      totalCo2Kg: 0,
      totalDivertedKg: 0,
      byRoute: { resell: 0, donate: 0, recycle: 0 },
      water: {
        reached: 0,
        current: 0,
        prevThreshold: 0,
        nextThreshold: WATER_MILESTONES[0],
        toNext: WATER_MILESTONES[0],
        fraction: 0,
      },
      co2: {
        reached: 0,
        current: 0,
        prevThreshold: 0,
        nextThreshold: CO2_MILESTONES[0],
        toNext: CO2_MILESTONES[0],
        fraction: 0,
      },
      milestonesReached: 0,
      plantStage: 1,
    });
  });

  it('sums routed garments and equals the domain lifetime over all events', () => {
    const garments = [
      makeGarment({ type: 'top', grade: 'A', route: 'resell' }),
      makeGarment({ type: 'pants', grade: 'C', route: 'donate' }),
      makeGarment({ type: 'jacket', grade: 'D', route: 'recycle' }),
    ];
    const stats = getProfileStats(garments);

    const expected = garmentLifetime(garments.flatMap((g) => g.passport));
    expect(stats.totalGarments).toBe(3);
    expect(stats.totalWaterL).toBe(expected.waterL);
    expect(stats.totalCo2Kg).toBe(expected.co2Kg);
    expect(stats.totalDivertedKg).toBe(expected.divertedKg);
    expect(stats.byRoute).toEqual({ resell: 1, donate: 1, recycle: 1 });
  });

  it('state-integrity rule on a concrete sequence: 4 added, 3 routed, 1 left unrouted', () => {
    // Add 4 garments; route exactly 3; leave the 4th saved-but-unrouted.
    const routedA = makeGarment({ type: 'top', grade: 'A', route: 'resell' });
    const routedB = makeGarment({ type: 'onesie', grade: 'B', route: 'resell' });
    const routedC = makeGarment({ type: 'pants', grade: 'C', route: 'donate' });
    const unrouted = makeGarment({ type: 'jacket', grade: 'D' }); // not routed

    const closet = [routedA, routedB, routedC, unrouted];
    const stats = getProfileStats(closet);

    // Profile total must equal the sum of EXACTLY the 3 routed garments —
    // computed independently here from the 3 routed savings, not from the
    // selector's own internals.
    const onlyRouted = garmentLifetime(
      [routedA, routedB, routedC].flatMap((g) => g.passport),
    );
    expect(stats.totalGarments).toBe(3);
    expect(stats.totalWaterL).toBe(onlyRouted.waterL);
    expect(stats.totalCo2Kg).toBe(onlyRouted.co2Kg);
    expect(stats.totalDivertedKg).toBe(onlyRouted.divertedKg);
    expect(stats.byRoute).toEqual({ resell: 2, donate: 1, recycle: 0 });

    // And the 4th garment's footprint is genuinely excluded: removing it from
    // the closet changes nothing.
    expect(getProfileStats([routedA, routedB, routedC])).toEqual(stats);
  });

  it('UNROUTED garments contribute exactly zero to every total', () => {
    const routed = makeGarment({ type: 'top', grade: 'A', route: 'resell' });
    const unroutedOne = makeGarment({ type: 'jacket', grade: 'D' });
    const unroutedTwo = makeGarment({ type: 'pants', grade: 'C' });

    const withOnlyRouted = getProfileStats([routed]);
    const withUnroutedToo = getProfileStats([routed, unroutedOne, unroutedTwo]);

    // Adding two unrouted garments changes nothing about the totals or counts.
    expect(withUnroutedToo).toEqual(withOnlyRouted);
    expect(withUnroutedToo.totalGarments).toBe(1);
  });

  it('derives both ladder progressions and the plant stage from the real totals', () => {
    const jackets = Array.from({ length: 6 }, () =>
      makeGarment({ type: 'jacket', grade: 'A', route: 'resell' }),
    );
    const stats = getProfileStats(jackets);
    const totals = garmentLifetime(jackets.flatMap((g) => g.passport));

    // Ladders are computed straight from the summed metrics — no points middle-man.
    expect(stats.water).toEqual(milestoneProgress(totals.waterL, WATER_MILESTONES));
    expect(stats.co2).toEqual(milestoneProgress(totals.co2Kg, CO2_MILESTONES));
    // Plant is driven by the COMBINED milestone count across both ladders.
    expect(stats.milestonesReached).toBe(stats.water.reached + stats.co2.reached);
    expect(stats.plantStage).toBe(plantStage(stats.milestonesReached));
    // Six premium jacket resells clear several milestones, so the plant has grown.
    expect(stats.milestonesReached).toBeGreaterThan(0);
    expect(stats.plantStage).toBeGreaterThan(1);
  });

  it('removing a garment subtracts its saving, so milestones and plant stage recompute', () => {
    // Two accessory resells clear the first water milestone (294 L each → 588 L ≥ 500 L).
    const a = makeGarment({ type: 'accessory', grade: 'A', route: 'resell' });
    const b = makeGarment({ type: 'accessory', grade: 'A', route: 'resell' });

    const both = getProfileStats([a, b]);
    expect(both.water.reached).toBe(1);
    expect(both.milestonesReached).toBe(1);
    expect(both.plantStage).toBe(2);

    // Remove one garment from the closet → the derived totals drop back below
    // the milestone with no stored total to go stale.
    const afterRemoval = getProfileStats([a]);
    expect(afterRemoval.totalWaterL).toBeLessThan(both.totalWaterL);
    expect(afterRemoval.totalWaterL).toBe(garmentLifetime(a.passport).waterL);
    expect(afterRemoval.water.reached).toBe(0);
    expect(afterRemoval.milestonesReached).toBe(0);
    expect(afterRemoval.plantStage).toBe(1);
  });
});

describe('getBadgeStats — wires the donatedHighReuse seam', () => {
  it('projects ProfileStats fields and carries the high-reuse flag', () => {
    const garments = [makeGarment({ type: 'top', grade: 'A', route: 'donate' })];
    const stats = getBadgeStats(garments, true);
    const profile = getProfileStats(garments);

    expect(stats).toEqual({
      totalGarments: profile.totalGarments,
      byRoute: profile.byRoute,
      totalWaterL: profile.totalWaterL,
      totalCo2Kg: profile.totalCo2Kg,
      donatedHighReuse: true,
    });
  });

  it('leaves donatedHighReuse undefined when not supplied', () => {
    expect(getBadgeStats([]).donatedHighReuse).toBeUndefined();
  });
});
