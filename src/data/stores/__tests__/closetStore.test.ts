import { computeSaving } from '../../../domain/impact';
import type { NewGarmentInput } from '../closetStore';
import { useClosetStore } from '../closetStore';

const sampleInput: NewGarmentInput = {
  imageUri: 'file://onesie.jpg',
  type: 'onesie',
  grade: 'B',
  defects: [{ label: 'pilling', confidence: 0.7, severity: 'minor' }],
};

beforeEach(() => {
  useClosetStore.getState().reset();
});

describe('addGarment', () => {
  it('adds an unrouted garment with an id, timestamp, and empty passport', () => {
    const created = useClosetStore.getState().addGarment(sampleInput);

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(created.route).toBeUndefined();
    expect(created.saving).toBeUndefined();
    expect(created.passport).toEqual([]);
    expect(useClosetStore.getState().garments).toHaveLength(1);
  });

  it('returns the created garment so the UI can navigate to it, and getById finds it', () => {
    const created = useClosetStore.getState().addGarment(sampleInput);
    expect(useClosetStore.getState().getById(created.id)).toEqual(created);
  });

  it('newest garment is first', () => {
    const first = useClosetStore.getState().addGarment(sampleInput);
    const second = useClosetStore.getState().addGarment({ ...sampleInput, type: 'top' });
    expect(useClosetStore.getState().garments.map((g) => g.id)).toEqual([second.id, first.id]);
  });
});

describe('updateGarment', () => {
  it('shallow-patches fields like nickname without touching others', () => {
    const created = useClosetStore.getState().addGarment(sampleInput);
    useClosetStore.getState().updateGarment(created.id, { nickname: 'Dino onesie' });
    const updated = useClosetStore.getState().getById(created.id);
    expect(updated?.nickname).toBe('Dino onesie');
    expect(updated?.type).toBe('onesie');
  });

  it('no-ops for an unknown id', () => {
    useClosetStore.getState().addGarment(sampleInput);
    expect(() =>
      useClosetStore.getState().updateGarment('does-not-exist', { nickname: 'x' }),
    ).not.toThrow();
  });
});

describe('routeGarment — computes and stores the saving + passport event', () => {
  it('stores the exact domain-computed saving on the garment', () => {
    const created = useClosetStore.getState().addGarment(sampleInput);
    useClosetStore.getState().routeGarment(created.id, 'resell');

    const garment = useClosetStore.getState().getById(created.id);
    // Reuses the domain math — must equal computeSaving, not a re-implementation.
    const expected = computeSaving('onesie', 'resell', 'B');
    expect(garment?.route).toBe('resell');
    expect(garment?.saving).toEqual(expected);
  });

  it('appends exactly one PassportEvent carrying the same saving, grade, and route', () => {
    const created = useClosetStore.getState().addGarment(sampleInput);
    useClosetStore.getState().routeGarment(created.id, 'donate');

    const garment = useClosetStore.getState().getById(created.id);
    expect(garment?.passport).toHaveLength(1);
    const event = garment!.passport[0];
    expect(event.route).toBe('donate');
    expect(event.grade).toBe('B');
    expect(event.saving).toEqual(computeSaving('onesie', 'donate', 'B'));
    expect(event.id).toBeTruthy();
    expect(event.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('honors an override route different from the recommendation', () => {
    // grade B recommends resell; parent chooses recycle and it sticks.
    const created = useClosetStore.getState().addGarment(sampleInput);
    useClosetStore.getState().routeGarment(created.id, 'recycle');
    const garment = useClosetStore.getState().getById(created.id);
    expect(garment?.route).toBe('recycle');
    expect(garment?.saving).toEqual(computeSaving('onesie', 'recycle', 'B'));
  });

  it('accrues a second event and sums the lifetime saving (multi-loop ready)', () => {
    const created = useClosetStore.getState().addGarment(sampleInput);
    useClosetStore.getState().routeGarment(created.id, 'resell');
    useClosetStore.getState().routeGarment(created.id, 'donate');

    const garment = useClosetStore.getState().getById(created.id);
    expect(garment?.passport).toHaveLength(2);

    const first = computeSaving('onesie', 'resell', 'B');
    const second = computeSaving('onesie', 'donate', 'B');
    expect(garment?.saving?.waterL).toBe(first.waterL + second.waterL);
    expect(garment?.saving?.co2Kg).toBe(
      Math.round((first.co2Kg + second.co2Kg) * 100) / 100,
    );
    // Latest route wins on the garment itself.
    expect(garment?.route).toBe('donate');
  });

  it('no-ops for an unknown id', () => {
    expect(() => useClosetStore.getState().routeGarment('nope', 'resell')).not.toThrow();
  });
});

describe('removeGarment', () => {
  it('removes the garment from the closet', () => {
    const a = useClosetStore.getState().addGarment(sampleInput);
    const b = useClosetStore.getState().addGarment({ ...sampleInput, type: 'top' });
    useClosetStore.getState().removeGarment(a.id);

    const ids = useClosetStore.getState().garments.map((g) => g.id);
    expect(ids).toEqual([b.id]);
    expect(useClosetStore.getState().getById(a.id)).toBeUndefined();
  });

  it('removing a routed garment drops it (totals derive from the closet, so they fall too)', () => {
    const created = useClosetStore.getState().addGarment(sampleInput);
    useClosetStore.getState().routeGarment(created.id, 'resell');
    expect(useClosetStore.getState().garments).toHaveLength(1);

    useClosetStore.getState().removeGarment(created.id);
    expect(useClosetStore.getState().garments).toHaveLength(0);
  });

  it('no-ops for an unknown id', () => {
    useClosetStore.getState().addGarment(sampleInput);
    expect(() => useClosetStore.getState().removeGarment('does-not-exist')).not.toThrow();
    expect(useClosetStore.getState().garments).toHaveLength(1);
  });
});
