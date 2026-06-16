import { buildListing } from '../handoffService';

describe('buildListing — marketplace listing text (Section 7.6)', () => {
  it('builds the title as "Kids\' {Type} — {condition phrase}"', () => {
    const listing = buildListing({ type: 'onesie', grade: 'A', defects: [] });
    expect(listing.title).toBe("Kids' Onesie — Like new!");
  });

  it('suggests a price band for A and B only', () => {
    expect(buildListing({ type: 'top', grade: 'A', defects: [] }).priceBand).toBe('$8–14');
    expect(buildListing({ type: 'top', grade: 'B', defects: [] }).priceBand).toBe('$5–9');
    expect(buildListing({ type: 'top', grade: 'C', defects: [] }).priceBand).toBeUndefined();
    expect(buildListing({ type: 'top', grade: 'D', defects: [] }).priceBand).toBeUndefined();
  });

  it('describes condition with no flaws when defects is empty', () => {
    const listing = buildListing({ type: 'dress', grade: 'A', defects: [] });
    expect(listing.condition).toBe('Like new!. No visible flaws.');
  });

  it('lists detected flaws in the condition description', () => {
    const listing = buildListing({
      type: 'pants',
      grade: 'C',
      defects: [
        { label: 'small stain', confidence: 0.8, severity: 'moderate' },
        { label: 'pilling', confidence: 0.6, severity: 'minor' },
      ],
    });
    expect(listing.condition).toBe('Still good, well-loved. Visible wear: small stain, pilling.');
  });

  it('puts the price line in the shareable text only when suggested', () => {
    const withBand = buildListing({ type: 'jacket', grade: 'B', defects: [] });
    expect(withBand.text).toContain('Asking $5–9.');
    expect(withBand.text).toContain("Kids' Jacket — Gently worn");

    const withoutBand = buildListing({ type: 'jacket', grade: 'D', defects: [] });
    expect(withoutBand.text).not.toContain('Asking');
  });
});
