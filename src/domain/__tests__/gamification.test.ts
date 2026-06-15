import { BADGES, CO2_MILESTONES, WATER_MILESTONES } from '../constants';
import {
  evaluateBadges,
  milestoneProgress,
  plantStage,
  PLANT_MAX_STAGE,
  type BadgeStats,
} from '../gamification';

function stats(overrides: Partial<BadgeStats> = {}): BadgeStats {
  return {
    totalGarments: 0,
    byRoute: { resell: 0, donate: 0, recycle: 0 },
    totalWaterL: 0,
    totalCo2Kg: 0,
    ...overrides,
  };
}

describe('milestone ladders are ascending and sized for kid garments', () => {
  it.each([
    ['water', WATER_MILESTONES, [500, 2000, 10000, 50000]],
    ['co2', CO2_MILESTONES, [1, 5, 25, 100]],
  ] as [string, readonly number[], number[]][])('%s ladder values', (_n, ladder, expected) => {
    expect([...ladder]).toEqual(expected);
    // Strictly ascending — milestoneProgress relies on this ordering.
    for (let i = 1; i < ladder.length; i += 1) {
      expect(ladder[i]).toBeGreaterThan(ladder[i - 1]);
    }
  });
});

describe('milestoneProgress — Water ladder', () => {
  it.each([
    // value, reached, prev, next, toNext, fraction
    [0, 0, 0, 500, 500, 0],
    [20, 0, 0, 500, 480, 20 / 500],
    [500, 1, 500, 2000, 1500, 0], // exactly on the first threshold
    [1250, 1, 500, 2000, 750, (1250 - 500) / 1500],
    [2000, 2, 2000, 10000, 8000, 0],
    [9999, 2, 2000, 10000, 1, (9999 - 2000) / 8000],
  ] as [number, number, number, number, number, number][])(
    '%i L → reached %i, next %p',
    (value, reached, prev, next, toNext, fraction) => {
      const p = milestoneProgress(value, WATER_MILESTONES);
      expect(p.reached).toBe(reached);
      expect(p.current).toBe(value);
      expect(p.prevThreshold).toBe(prev);
      expect(p.nextThreshold).toBe(next);
      expect(p.toNext).toBe(toNext);
      expect(p.fraction).toBeCloseTo(fraction, 6);
    },
  );

  it('caps at the top of the ladder (maxed → no next threshold)', () => {
    const maxed = milestoneProgress(50_000, WATER_MILESTONES);
    expect(maxed.reached).toBe(WATER_MILESTONES.length);
    expect(maxed.nextThreshold).toBeNull();
    expect(maxed.toNext).toBe(0);
    expect(maxed.fraction).toBe(1);
    // Beyond the last threshold stays maxed.
    expect(milestoneProgress(999_999, WATER_MILESTONES).fraction).toBe(1);
  });

  it('clamps negative input to zero', () => {
    const p = milestoneProgress(-100, WATER_MILESTONES);
    expect(p.reached).toBe(0);
    expect(p.current).toBe(0);
    expect(p.nextThreshold).toBe(500);
  });
});

describe('milestoneProgress — CO₂ ladder (fractional values round cleanly)', () => {
  it('a small CO₂ total sits on the first band with a clean toNext', () => {
    const p = milestoneProgress(1.34, CO2_MILESTONES);
    expect(p.reached).toBe(1);
    expect(p.prevThreshold).toBe(1);
    expect(p.nextThreshold).toBe(5);
    expect(p.toNext).toBe(3.66); // 5 - 1.34, rounded — never 3.6599999…
    expect(p.fraction).toBeCloseTo((1.34 - 1) / 4, 6);
  });

  it('reaches a higher band and maxes out', () => {
    expect(milestoneProgress(25, CO2_MILESTONES).reached).toBe(3);
    const maxed = milestoneProgress(100, CO2_MILESTONES);
    expect(maxed.reached).toBe(4);
    expect(maxed.nextThreshold).toBeNull();
  });
});

describe('plantStage — combined milestones across BOTH ladders drive the plant', () => {
  it.each([
    [0, 1],
    [1, 2],
    [2, 3],
    [4, 5],
    [5, 6],
    [6, 6], // caps at full bloom
    [8, 6], // both ladders fully maxed (4 + 4) still caps
  ])('%i combined milestones → plant stage %i', (combined, expected) => {
    expect(plantStage(combined)).toBe(expected);
  });

  it('never exceeds PLANT_MAX_STAGE and never drops below 1', () => {
    expect(plantStage(100)).toBe(PLANT_MAX_STAGE);
    expect(plantStage(-5)).toBe(1);
  });

  it('hitting a milestone on EITHER track advances the plant one step', () => {
    const combined = (waterL: number, co2Kg: number) =>
      milestoneProgress(waterL, WATER_MILESTONES).reached +
      milestoneProgress(co2Kg, CO2_MILESTONES).reached;

    // Nothing reached yet → stage 1.
    expect(plantStage(combined(0, 0))).toBe(1);
    // Cross the first WATER milestone only → advances to stage 2.
    expect(plantStage(combined(600, 0))).toBe(2);
    // Then also cross the first CO₂ milestone → advances again to stage 3.
    expect(plantStage(combined(600, 2))).toBe(3);
    // A pure-CO₂ saver advances purely off the CO₂ track.
    expect(plantStage(combined(0, 6))).toBe(3); // co2 reached 2 → stage 3
  });
});

describe('evaluateBadges', () => {
  it('awards nothing for zero stats (scanning alone earns nothing)', () => {
    expect(evaluateBadges(stats(), [])).toEqual([]);
  });

  it('awards first_loop on the first routed garment', () => {
    const s = stats({ totalGarments: 1, byRoute: { resell: 1, donate: 0, recycle: 0 } });
    expect(evaluateBadges(s, [])).toEqual(['first_loop']);
  });

  it('never re-awards already-earned badges', () => {
    const s = stats({ totalGarments: 1, byRoute: { resell: 1, donate: 0, recycle: 0 } });
    expect(evaluateBadges(s, ['first_loop'])).toEqual([]);
  });

  it('is idempotent: evaluate → merge → evaluate again returns nothing new', () => {
    const s = stats({
      totalGarments: 10,
      byRoute: { resell: 10, donate: 0, recycle: 0 },
      totalWaterL: 10500,
      totalCo2Kg: 14,
    });
    const first = evaluateBadges(s, []);
    expect(first.length).toBeGreaterThan(0);
    expect(evaluateBadges(s, first)).toEqual([]);
  });

  it('returns several newly crossed badges at once', () => {
    const s = stats({
      totalGarments: 10,
      byRoute: { resell: 10, donate: 0, recycle: 0 },
      totalWaterL: 10500,
      totalCo2Kg: 14,
    });
    const newly = evaluateBadges(s, ['first_loop', 'closet_5']);
    expect(new Set(newly)).toEqual(
      new Set(['rehomer_10', 'resell_10', 'water_1k', 'water_10k', 'co2_10']),
    );
  });

  describe('route-count badges fire exactly at their thresholds', () => {
    it.each([
      ['closet_5', { totalGarments: 5 }, { totalGarments: 4 }],
      ['rehomer_10', { totalGarments: 10 }, { totalGarments: 9 }],
      ['champion_25', { totalGarments: 25 }, { totalGarments: 24 }],
      [
        'resell_10',
        { byRoute: { resell: 10, donate: 0, recycle: 0 } },
        { byRoute: { resell: 9, donate: 0, recycle: 0 } },
      ],
      [
        'donate_10',
        { byRoute: { resell: 0, donate: 10, recycle: 0 } },
        { byRoute: { resell: 0, donate: 9, recycle: 0 } },
      ],
      [
        'recycle_5',
        { byRoute: { resell: 0, donate: 0, recycle: 5 } },
        { byRoute: { resell: 0, donate: 0, recycle: 4 } },
      ],
    ] as [string, Partial<BadgeStats>, Partial<BadgeStats>][])(
      '%s',
      (id, atThreshold, justBelow) => {
        expect(evaluateBadges(stats(atThreshold), [])).toContain(id);
        expect(evaluateBadges(stats(justBelow), [])).not.toContain(id);
      },
    );
  });

  describe('impact-total badges fire exactly at their thresholds', () => {
    it.each([
      ['water_1k', { totalWaterL: 1000 }, { totalWaterL: 999 }],
      ['water_10k', { totalWaterL: 10000 }, { totalWaterL: 9999 }],
      ['co2_10', { totalCo2Kg: 10 }, { totalCo2Kg: 9.99 }],
      ['co2_50', { totalCo2Kg: 50 }, { totalCo2Kg: 49.99 }],
    ] as [string, Partial<BadgeStats>, Partial<BadgeStats>][])(
      '%s',
      (id, atThreshold, justBelow) => {
        expect(evaluateBadges(stats(atThreshold), [])).toContain(id);
        expect(evaluateBadges(stats(justBelow), [])).not.toContain(id);
      },
    );
  });

  it('awards local_giver only when a donation reached a high-reuse spot', () => {
    const donated = stats({
      totalGarments: 1,
      byRoute: { resell: 0, donate: 1, recycle: 0 },
    });
    expect(evaluateBadges({ ...donated, donatedHighReuse: true }, ['first_loop'])).toEqual([
      'local_giver',
    ]);
    expect(evaluateBadges({ ...donated, donatedHighReuse: false }, ['first_loop'])).toEqual([]);
    expect(evaluateBadges(donated, ['first_loop'])).toEqual([]); // flag absent
  });

  it('no badge depends on a points abstraction — all fire from real metrics + routes', () => {
    const everything: BadgeStats = {
      totalGarments: 25,
      byRoute: { resell: 10, donate: 10, recycle: 5 },
      totalWaterL: 10000,
      totalCo2Kg: 50,
      donatedHighReuse: true,
    };
    expect(new Set(evaluateBadges(everything, []))).toEqual(new Set(BADGES.map((b) => b.id)));
    expect(BADGES).toHaveLength(12);
  });

  it('ignores unknown ids in earnedIds instead of crashing', () => {
    const s = stats({ totalGarments: 1, byRoute: { resell: 1, donate: 0, recycle: 0 } });
    expect(evaluateBadges(s, ['some_retired_badge'])).toEqual(['first_loop']);
  });
});
