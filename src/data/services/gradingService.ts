// The grading-service seam (Section 11). The real computer-vision model is NOT
// built here — the whole app talks to this interface, so swapping the mock for
// the real grader later requires zero UI changes. The mock returns a
// deterministic, rehearsable cycle of fixtures (no randomness) and every result
// is validated with zod before it crosses the boundary (Section 12).
import { z } from 'zod';

import { recommendedRoute } from '../../domain/grading-rules';
import type { GarmentType, Grade, ScanResult } from '../../domain/types';

const GARMENT_TYPES = [
  'onesie',
  'top',
  'pants',
  'dress',
  'jacket',
  'sleepwear',
  'accessory',
  'unknown',
] as const satisfies readonly GarmentType[];

const GRADES = ['A', 'B', 'C', 'D'] as const satisfies readonly Grade[];

const defectSchema = z.object({
  label: z.string().min(1),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['minor', 'moderate', 'major']),
});

/** Validates anything claiming to be a ScanResult before it reaches the app. */
export const scanResultSchema = z.object({
  type: z.enum(GARMENT_TYPES),
  grade: z.enum(GRADES),
  defects: z.array(defectSchema),
  recommendedRoute: z.enum(['resell', 'donate', 'recycle']),
  imageUri: z.string().min(1),
  annotatedUri: z.string().optional(),
  confidence: z.number().min(0).max(1),
}) satisfies z.ZodType<ScanResult>;

export interface GradingService {
  analyze(imageUri: string): Promise<ScanResult>;
}

// The deterministic fixture cycle (Section 11): top/A → onesie/B → pants/C →
// jacket/D, then repeats. Routes are derived from the domain rules so the mock
// can never disagree with the grade→route mapping the rest of the app uses.
type Fixture = {
  type: GarmentType;
  grade: Grade;
  defects: ScanResult['defects'];
  confidence: number;
};

const FIXTURES: readonly Fixture[] = [
  { type: 'top', grade: 'A', defects: [], confidence: 0.96 },
  {
    type: 'onesie',
    grade: 'B',
    defects: [{ label: 'pilling', confidence: 0.71, severity: 'minor' }],
    confidence: 0.88,
  },
  {
    type: 'pants',
    grade: 'C',
    defects: [{ label: 'small stain', confidence: 0.79, severity: 'moderate' }],
    confidence: 0.82,
  },
  {
    type: 'jacket',
    grade: 'D',
    defects: [{ label: 'tear', confidence: 0.9, severity: 'major' }],
    confidence: 0.85,
  },
];

const DEFAULT_DELAY_MS = 1200; // ~1.2s so the analyzing state feels real (Section 11)

export class MockGradingService implements GradingService {
  private cursor = 0; // in-memory only — the cycle restarts each app launch
  private readonly delayMs: number;

  constructor(delayMs: number = DEFAULT_DELAY_MS) {
    this.delayMs = delayMs;
  }

  async analyze(imageUri: string): Promise<ScanResult> {
    const fixture = FIXTURES[this.cursor % FIXTURES.length];
    this.cursor += 1;

    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const result: ScanResult = {
      type: fixture.type,
      grade: fixture.grade,
      defects: fixture.defects,
      recommendedRoute: recommendedRoute(fixture.grade),
      imageUri,
      confidence: fixture.confidence,
    };

    // Validate at the boundary even for our own mock, so the schema is
    // exercised constantly and the real grader inherits the same guarantee.
    return scanResultSchema.parse(result);
  }
}

/** The single grading-service instance the whole app imports (Section 11). */
export const gradingService: GradingService = new MockGradingService();
