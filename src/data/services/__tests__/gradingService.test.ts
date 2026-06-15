import { MockGradingService, scanResultSchema } from '../gradingService';

// Zero-delay instances so the deterministic cycle is tested without waiting
// ~1.2s per call. The shipped singleton keeps the real delay.
describe('MockGradingService — deterministic fixture cycle (Section 11)', () => {
  it('returns top/A → onesie/B → pants/C → jacket/D in order', async () => {
    const service = new MockGradingService(0);
    const results = [
      await service.analyze('file://1.jpg'),
      await service.analyze('file://2.jpg'),
      await service.analyze('file://3.jpg'),
      await service.analyze('file://4.jpg'),
    ];
    expect(results.map((r) => [r.type, r.grade])).toEqual([
      ['top', 'A'],
      ['onesie', 'B'],
      ['pants', 'C'],
      ['jacket', 'D'],
    ]);
  });

  it('repeats the same 4-fixture cycle and is fully deterministic', async () => {
    const service = new MockGradingService(0);
    const eight: [string, string][] = [];
    for (let i = 0; i < 8; i += 1) {
      const r = await service.analyze(`file://${i}.jpg`);
      eight.push([r.type, r.grade]);
    }
    expect(eight).toEqual([
      ['top', 'A'],
      ['onesie', 'B'],
      ['pants', 'C'],
      ['jacket', 'D'],
      ['top', 'A'],
      ['onesie', 'B'],
      ['pants', 'C'],
      ['jacket', 'D'],
    ]);
  });

  it('two fresh instances produce identical sequences (no shared/global state)', async () => {
    const a = new MockGradingService(0);
    const b = new MockGradingService(0);
    const seqA = [await a.analyze('x'), await a.analyze('x')].map((r) => r.type);
    const seqB = [await b.analyze('y'), await b.analyze('y')].map((r) => r.type);
    expect(seqA).toEqual(seqB);
  });

  it('derives recommendedRoute from the grade (matches the domain mapping)', async () => {
    const service = new MockGradingService(0);
    const routes = [
      await service.analyze('a'),
      await service.analyze('b'),
      await service.analyze('c'),
      await service.analyze('d'),
    ].map((r) => r.recommendedRoute);
    expect(routes).toEqual(['resell', 'resell', 'donate', 'recycle']);
  });

  it('echoes the passed image uri and attaches the expected defects', async () => {
    const service = new MockGradingService(0);
    const a = await service.analyze('file://photo-a.jpg');
    expect(a.imageUri).toBe('file://photo-a.jpg');
    expect(a.defects).toEqual([]); // grade A: pristine

    const b = await service.analyze('file://photo-b.jpg');
    expect(b.defects).toEqual([{ label: 'pilling', confidence: 0.71, severity: 'minor' }]);
  });

  it('returns results that pass the zod boundary schema', async () => {
    const service = new MockGradingService(0);
    for (let i = 0; i < 4; i += 1) {
      const result = await service.analyze('file://x.jpg');
      expect(() => scanResultSchema.parse(result)).not.toThrow();
    }
  });

  it('applies a delay when configured (analyzing state feels real)', async () => {
    jest.useFakeTimers();
    const service = new MockGradingService(1200);
    const promise = service.analyze('file://x.jpg');
    let settled = false;
    void promise.then(() => {
      settled = true;
    });
    // Not resolved before the timer elapses.
    await Promise.resolve();
    expect(settled).toBe(false);
    jest.advanceTimersByTime(1200);
    await promise;
    expect(settled).toBe(true);
    jest.useRealTimers();
  });
});

describe('scanResultSchema — rejects malformed grading output', () => {
  it('rejects an out-of-range confidence', () => {
    expect(() =>
      scanResultSchema.parse({
        type: 'top',
        grade: 'A',
        defects: [],
        recommendedRoute: 'resell',
        imageUri: 'file://x.jpg',
        confidence: 1.5,
      }),
    ).toThrow();
  });

  it('rejects an unknown grade', () => {
    expect(() =>
      scanResultSchema.parse({
        type: 'top',
        grade: 'F',
        defects: [],
        recommendedRoute: 'resell',
        imageUri: 'file://x.jpg',
        confidence: 0.9,
      }),
    ).toThrow();
  });

  it('rejects a bad defect severity', () => {
    expect(() =>
      scanResultSchema.parse({
        type: 'top',
        grade: 'B',
        defects: [{ label: 'pilling', confidence: 0.5, severity: 'catastrophic' }],
        recommendedRoute: 'resell',
        imageUri: 'file://x.jpg',
        confidence: 0.9,
      }),
    ).toThrow();
  });
});
