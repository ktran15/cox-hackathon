// Shared domain types — Section 9. Pure types only: no React, no side effects.

export type Grade = 'A' | 'B' | 'C' | 'D';
export type Route = 'resell' | 'donate' | 'recycle';
export type GarmentType =
  | 'onesie'
  | 'top'
  | 'pants'
  | 'dress'
  | 'jacket'
  | 'sleepwear'
  | 'accessory'
  | 'unknown';

export interface Defect {
  label: string;
  confidence: number;
  severity: 'minor' | 'moderate' | 'major';
}

export interface ScanResult {
  type: GarmentType;
  grade: Grade;
  defects: Defect[];
  recommendedRoute: Route;
  imageUri: string;
  annotatedUri?: string;
  confidence: number;
}

export interface Saving {
  waterL: number;
  co2Kg: number;
  divertedKg: number;
}

export interface PassportEvent {
  id: string; // crypto-safe unique id (e.g. expo-crypto randomUUID or a tiny uid util)
  at: string; // ISO
  grade: Grade;
  route: Route;
  saving: Saving;
  note?: string;
}

export interface Garment {
  id: string;
  tagId?: string;
  createdAt: string; // ISO
  imageUri: string; // local file in document directory
  type: GarmentType;
  grade: Grade;
  defects: Defect[];
  route?: Route; // undefined = saved but not routed yet
  saving?: Saving; // undefined until routed
  nickname?: string;
  passport: PassportEvent[]; // empty until routed; designed to grow
}

/**
 * Progress along one ascending milestone ladder (Water or CO₂). Derived, never
 * stored — recomputed from the closet totals every render (Section 4).
 */
export interface MilestoneProgress {
  /** How many ladder thresholds the current total has reached. */
  reached: number;
  /** The metric's current total (L for water, kg for CO₂). */
  current: number;
  /** The previous, already-reached threshold (0 before the first one). */
  prevThreshold: number;
  /** The next threshold to aim for, or null once the ladder is maxed out. */
  nextThreshold: number | null;
  /** Amount still needed to reach nextThreshold (0 when maxed). */
  toNext: number;
  /** 0..1 fill from prevThreshold toward nextThreshold (1 when maxed). */
  fraction: number;
}

export interface ProfileStats {
  totalGarments: number; // routed garments
  totalWaterL: number;
  totalCo2Kg: number;
  totalDivertedKg: number;
  byRoute: Record<Route, number>;
  /** Progress along the Water Saved ladder. */
  water: MilestoneProgress;
  /** Progress along the CO₂ Saved ladder. */
  co2: MilestoneProgress;
  /** Total milestones reached across BOTH ladders (water.reached + co2.reached). */
  milestonesReached: number;
  /** LevelPlant growth stage (1..6) driven by milestonesReached. */
  plantStage: number;
}
