// Scan store (Section 10) — the transient analyze lifecycle. NOT persisted: a
// half-finished scan should never survive an app restart. Holds the captured
// image, the grading result, and the status the Scan/Analyzing/Result screens
// drive off. All model work hides behind the gradingService seam (Section 11).
import { create } from 'zustand';

import type { ScanResult } from '../../domain/types';
import { gradingService } from '../services/gradingService';

export type ScanStatus = 'idle' | 'analyzing' | 'done' | 'error';

export interface ScanState {
  imageUri?: string;
  result?: ScanResult;
  status: ScanStatus;
  error?: string;
  /** Runs the grader on a captured/picked image and stores the result. */
  analyze: (imageUri: string) => Promise<void>;
  /** Clears everything back to idle (leaving the flow, starting over). */
  reset: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  status: 'idle',

  analyze: async (imageUri) => {
    set({ imageUri, result: undefined, error: undefined, status: 'analyzing' });
    try {
      const result = await gradingService.analyze(imageUri);
      set({ result, status: 'done' });
    } catch (err) {
      // Errors are surfaced, never swallowed (Section 12). The Analyzing screen
      // shows a friendly retry off this status.
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Something went wrong while analyzing.',
      });
    }
  },

  reset: () => set({ imageUri: undefined, result: undefined, error: undefined, status: 'idle' }),
}));
