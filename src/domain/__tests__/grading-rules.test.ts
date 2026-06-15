import {
  gradeStatus,
  recommendationReason,
  recommendedRoute,
  routeCopy,
} from '../grading-rules';
import type { Grade, Route } from '../types';

const ALL_GRADES: Grade[] = ['A', 'B', 'C', 'D'];
const ALL_ROUTES: Route[] = ['resell', 'donate', 'recycle'];

describe('recommendedRoute — Section 8.1 mapping', () => {
  it.each([
    ['A', 'resell'],
    ['B', 'resell'],
    ['C', 'donate'],
    ['D', 'recycle'],
  ] as [Grade, Route][])('grade %s → %s', (grade, route) => {
    expect(recommendedRoute(grade)).toBe(route);
  });
});

describe('plain-language copy (Section 7.5 exact statuses)', () => {
  it.each([
    ['A', 'Like new!'],
    ['B', 'Gently worn'],
    ['C', 'Still good, well-loved'],
    ['D', 'Too worn to wear again'],
  ] as [Grade, string][])('grade %s status is "%s"', (grade, status) => {
    expect(gradeStatus[grade]).toBe(status);
  });

  it('every grade has a non-empty recommendation reason', () => {
    for (const grade of ALL_GRADES) {
      expect(recommendationReason[grade].length).toBeGreaterThan(0);
    }
  });

  it('every route has complete copy and no internal jargon', () => {
    for (const route of ALL_ROUTES) {
      const copy = routeCopy[route];
      expect(copy.label.length).toBeGreaterThan(0);
      expect(copy.actionLabel.length).toBeGreaterThan(0);
      expect(copy.doneLabel.length).toBeGreaterThan(0);
      expect(copy.oneLiner.length).toBeGreaterThan(0);
    }
    // Plain words (Section 1): no internal terms anywhere in user-facing copy.
    const allCopy = [
      ...Object.values(gradeStatus),
      ...Object.values(recommendationReason),
      ...ALL_ROUTES.flatMap((r) => Object.values(routeCopy[r])),
    ].join(' ');
    expect(allCopy).not.toMatch(/\bCV\b|route factor|grade [A-D]\b/i);
  });

  it('action labels match their result labels (microcopy rule, Section 12)', () => {
    expect(routeCopy.donate.actionLabel).toBe('Donate it');
    expect(routeCopy.donate.doneLabel).toBe('Donated!');
    expect(routeCopy.recycle.actionLabel).toBe('Recycle it');
    expect(routeCopy.recycle.doneLabel).toBe('Recycled!');
  });
});
