import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  textSizeMultiplier,
  type as typeStyle,
  type TextSize,
  type TypeVariant,
} from './typography';

// SPEC-NOTE: In Milestone 3 this provider will read/write settingsStore so the
// choice persists. For Milestone 1 it holds the value in React state only.

interface TextSizeContextValue {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  multiplier: number;
}

const TextSizeContext = createContext<TextSizeContextValue>({
  textSize: 'normal',
  setTextSize: () => undefined,
  multiplier: 1,
});

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const value = useMemo(
    () => ({ textSize, setTextSize, multiplier: textSizeMultiplier[textSize] }),
    [textSize],
  );
  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}

export function useTextSize(): TextSizeContextValue {
  return useContext(TextSizeContext);
}

/** Text style for a variant, scaled by the user's in-app text-size setting. */
export function useType(variant: TypeVariant) {
  const { multiplier } = useTextSize();
  return typeStyle(variant, multiplier);
}
