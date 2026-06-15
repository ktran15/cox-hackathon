// Grading rules — Section 8.1. Grade → recommended route, plus the
// plain-language copy per grade/route so the UI never hardcodes strings
// twice. Parent overrides are honored elsewhere; this module only recommends.

import type { Grade, Route } from './types';

export function recommendedRoute(grade: Grade): Route {
  switch (grade) {
    case 'A':
    case 'B':
      return 'resell';
    case 'C':
      return 'donate';
    case 'D':
      return 'recycle';
    default: {
      const exhaustive: never = grade;
      return exhaustive;
    }
  }
}

// Plain-language status per grade (Section 7.5 — exact strings).
export const gradeStatus: Record<Grade, string> = {
  A: 'Like new!',
  B: 'Gently worn',
  C: 'Still good, well-loved',
  D: 'Too worn to wear again',
};

// One-line reason for the Result screen's "We suggest: {Route}" card.
// No judgment (Section 1): a worn-out item recycled is still a win.
export const recommendationReason: Record<Grade, string> = {
  A: 'It looks brand new, so another family would happily buy it.',
  B: 'Gently worn clothes still sell well.',
  C: 'It has plenty of wear left, so donating puts it straight onto another kid.',
  D: 'The fabric can live on as something new instead of going to landfill.',
};

export interface RouteCopy {
  /** Display name, e.g. for chips and headers. */
  label: string;
  /** Button label — matches its result (Section 12 microcopy rule). */
  actionLabel: string;
  /** Success label after completing the route. */
  doneLabel: string;
  /** One-line reassurance shown on the route action screen. */
  oneLiner: string;
}

export const routeCopy: Record<Route, RouteCopy> = {
  resell: {
    label: 'Resell',
    actionLabel: 'Resell it',
    doneLabel: 'Listing ready!',
    oneLiner: 'Earn a little back while it helps another family.',
  },
  donate: {
    label: 'Donate',
    actionLabel: 'Donate it',
    doneLabel: 'Donated!',
    oneLiner: 'Give it straight to a family who needs it.',
  },
  recycle: {
    label: 'Recycle',
    actionLabel: 'Recycle it',
    doneLabel: 'Recycled!',
    oneLiner: 'Worn-out clothes become new fiber instead of landfill.',
  },
};
