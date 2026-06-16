// Handoff helpers (Section 7.6). Pure listing-text builder for the Resell mode:
// turns a scan into a ready-to-paste marketplace listing. No side effects, no
// React — the share/copy/open actions live in the UI; this only shapes text.
// Reuses the domain's plain-language grade copy so wording never diverges.
import { gradeStatus } from '../../domain/grading-rules';
import type { Defect, GarmentType, Grade } from '../../domain/types';

// Suggested price bands (Section 7.6). A/B only — worn-out items aren't resold.
const PRICE_BAND: Partial<Record<Grade, string>> = {
  A: '$8–14',
  B: '$5–9',
};

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface Listing {
  /** "Kids' {Type} — {condition phrase}". */
  title: string;
  /** One-line condition description built from grade + detected flaws. */
  condition: string;
  /** Suggested price band, or undefined for C/D (resell not suggested). */
  priceBand?: string;
  /** Full multi-line text for copy / share. */
  text: string;
}

export function buildListing(input: {
  type: GarmentType;
  grade: Grade;
  defects: Defect[];
}): Listing {
  const { type, grade, defects } = input;
  const phrase = gradeStatus[grade];
  const title = `Kids' ${titleCase(type)} — ${phrase}`;
  const priceBand = PRICE_BAND[grade];

  const flawText = defects.length
    ? ` Visible wear: ${defects.map((d) => d.label).join(', ')}.`
    : ' No visible flaws.';
  const condition = `${phrase}.${flawText}`;

  const parts = [title, '', condition];
  if (priceBand) parts.push('', `Asking ${priceBand}.`);
  parts.push('', 'Re-homed through Hand-Me-Up — keeping kids’ clothes in use.');

  return { title, condition, priceBand, text: parts.join('\n') };
}
