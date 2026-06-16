// The grading-service seam (Section 11). The CV model now lives behind the
// `ClaudeGradingService` below, which calls the Claude Vision API to grade a
// garment from its photo. The whole app talks to the `GradingService`
// interface, so swapping YOLO → Claude required ZERO UI changes. Every result
// is validated with zod before it crosses the boundary (Section 12), and any
// API problem (missing key, network failure, malformed response) falls back to
// the deterministic `MockGradingService` so the demo never hard-fails.
import * as FileSystem from 'expo-file-system/legacy';
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

// --- Claude Vision grader -------------------------------------------------

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
// Haiku 4.5 — fast, supports vision, cheap enough to grade every scan.
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const CLAUDE_VERSION = '2023-06-01';
// Bound a hung request so the analyzing screen never waits forever — fall back.
const CLAUDE_TIMEOUT_MS = 12000;

// The rubric lives entirely in the system prompt (Section 8.1 / 7.5). Claude
// must return ONLY the JSON object — no markdown, no preamble — so we can parse
// it straight into a ScanResult.
const GRADING_SYSTEM_PROMPT = `You grade photos of a single child's garment for a kids' clothing reuse app.

Identify the garment type — exactly one of: onesie, top, pants, dress, jacket, sleepwear, accessory, unknown.

Assess the condition grade:
- A = like new, no visible flaws
- B = gently worn, minor cosmetic issues (light pilling, tiny marks)
- C = well-loved, moderate wear (fading, small stains, noticeable pilling)
- D = too worn to wear again, structural damage or heavy staining (tears, holes, large stains)

List any visible defects. Each defect has: label (a short phrase), confidence (a number from 0 to 1), and severity (one of: minor, moderate, major). Use an empty array when there are no visible defects.

Recommend the best destination route, following these rules exactly: grade A or B -> "resell"; grade C -> "donate"; grade D -> "recycle".

Respond with ONLY valid JSON — no markdown, no code fences, no preamble — matching exactly this shape:
{"type": string, "grade": string, "defects": [{"label": string, "confidence": number, "severity": string}], "recommendedRoute": string}`;

/** Pulls the JSON object out of Claude's text response (tolerates stray fences). */
function parseGradingJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in Claude response');
  }
  return JSON.parse(text.slice(start, end + 1));
}

interface ClaudeMessagesResponse {
  content?: { type: string; text?: string }[];
}

/**
 * Grades a garment by sending its photo to the Claude Vision API. On a missing
 * API key, a network/API failure, or a response that fails the zod boundary
 * schema, it silently falls back to the injected mock grader (logging the
 * reason) — the demo must never hard-fail because of an API issue.
 */
export class ClaudeGradingService implements GradingService {
  private readonly fallback: GradingService;
  private readonly apiKey?: string;

  constructor(fallback: GradingService = new MockGradingService()) {
    this.fallback = fallback;
    // EXPO_PUBLIC_* vars are inlined by Expo at build time; never hardcode.
    this.apiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  }

  async analyze(imageUri: string): Promise<ScanResult> {
    if (!this.apiKey) {
      console.warn(
        '[ClaudeGradingService] EXPO_PUBLIC_CLAUDE_API_KEY is not set — using the mock grader.',
      );
      return this.fallback.analyze(imageUri);
    }

    try {
      const candidate = await this.requestGrading(imageUri, this.apiKey);
      // Validate at the boundary (Section 12) — a malformed/hallucinated shape
      // throws here and routes us to the fallback instead of into the UI.
      return scanResultSchema.parse(candidate);
    } catch (error) {
      console.warn(
        '[ClaudeGradingService] grading failed; falling back to the mock grader.',
        error,
      );
      return this.fallback.analyze(imageUri);
    }
  }

  /** Builds + sends the request and maps the reply into a candidate ScanResult. */
  private async requestGrading(imageUri: string, apiKey: string): Promise<unknown> {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Scan images are saved as compressed JPEG (prepareGarmentImage); guard
    // anyway in case a PNG ever reaches the grader.
    const mediaType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': CLAUDE_VERSION,
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 512,
          system: GRADING_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64 },
                },
                { type: 'text', text: 'Grade this garment and reply with only the JSON.' },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Claude API ${response.status}: ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as ClaudeMessagesResponse;
    const text = payload.content?.find((block) => block.type === 'text')?.text ?? '';
    const parsed = parseGradingJson(text);

    // Map into a full ScanResult: take the model's fields, attach the local
    // image uri and a fixed confidence (Section 9). zod validates in analyze().
    return {
      ...(typeof parsed === 'object' && parsed !== null ? parsed : {}),
      imageUri,
      confidence: 0.85,
    };
  }
}

/**
 * The single grading-service instance the whole app imports (Section 11).
 * Claude Vision is the primary grader; the mock is its silent fallback.
 */
export const gradingService: GradingService = new ClaudeGradingService(
  new MockGradingService(),
);
