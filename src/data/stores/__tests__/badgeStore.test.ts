import type { BadgeStats } from '../../../domain/gamification';
import { useBadgeStore } from '../badgeStore';

function stats(overrides: Partial<BadgeStats> = {}): BadgeStats {
  return {
    totalGarments: 0,
    byRoute: { resell: 0, donate: 0, recycle: 0 },
    totalWaterL: 0,
    totalCo2Kg: 0,
    ...overrides,
  };
}

beforeEach(() => {
  useBadgeStore.getState().reset();
});

describe('badgeStore.awardFromStats — domain integration without double-awarding', () => {
  it('persists newly earned badges and returns their ids', () => {
    const firstRoute = stats({ totalGarments: 1, byRoute: { resell: 1, donate: 0, recycle: 0 } });
    const newly = useBadgeStore.getState().awardFromStats(firstRoute);

    expect(newly).toEqual(['first_loop']);
    expect(useBadgeStore.getState().earned.map((b) => b.id)).toEqual(['first_loop']);
    expect(useBadgeStore.getState().hasBadge('first_loop')).toBe(true);
  });

  it('stamps each earned badge with an ISO earnedAt', () => {
    useBadgeStore
      .getState()
      .awardFromStats(stats({ totalGarments: 1, byRoute: { resell: 1, donate: 0, recycle: 0 } }));
    const earned = useBadgeStore.getState().earned[0];
    expect(earned.earnedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isNaN(Date.parse(earned.earnedAt))).toBe(false);
  });

  it('does NOT re-award a badge already earned (idempotent across calls)', () => {
    const s = stats({ totalGarments: 1, byRoute: { resell: 1, donate: 0, recycle: 0 } });
    expect(useBadgeStore.getState().awardFromStats(s)).toEqual(['first_loop']);

    // Same stats again → nothing new, and the store still holds exactly one.
    expect(useBadgeStore.getState().awardFromStats(s)).toEqual([]);
    expect(useBadgeStore.getState().earned).toHaveLength(1);
  });

  it('awards only the badges newly crossed as stats grow over time', () => {
    // First route.
    useBadgeStore
      .getState()
      .awardFromStats(stats({ totalGarments: 1, byRoute: { resell: 1, donate: 0, recycle: 0 } }));

    // Grow to 5 resells + 1,000 L: first_loop already held, so only the new ones.
    const newly = useBadgeStore.getState().awardFromStats(
      stats({
        totalGarments: 5,
        byRoute: { resell: 5, donate: 0, recycle: 0 },
        totalWaterL: 1000,
      }),
    );
    expect(new Set(newly)).toEqual(new Set(['closet_5', 'water_1k']));
    expect(useBadgeStore.getState().earned).toHaveLength(3); // first_loop + 2 new
  });

  it('persists no duplicates even when called twice with identical maxed stats', () => {
    const maxed = stats({
      totalGarments: 25,
      byRoute: { resell: 10, donate: 10, recycle: 5 },
      totalWaterL: 10000,
      totalCo2Kg: 50,
      donatedHighReuse: true,
    });
    const firstPass = useBadgeStore.getState().awardFromStats(maxed);
    expect(firstPass).toHaveLength(12); // all badges at once

    const secondPass = useBadgeStore.getState().awardFromStats(maxed);
    expect(secondPass).toEqual([]);

    const ids = useBadgeStore.getState().earned.map((b) => b.id);
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12); // no duplicates
  });

  it('returns [] and writes nothing when no criteria are met', () => {
    expect(useBadgeStore.getState().awardFromStats(stats())).toEqual([]);
    expect(useBadgeStore.getState().earned).toHaveLength(0);
  });
});
