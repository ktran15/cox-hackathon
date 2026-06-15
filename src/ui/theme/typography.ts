// Typography — Section 5.4 "Cut-Paper Classroom".
// Display/headers/big numbers: Grandstander (600/700/800) — hand-lettered,
// kid-made character, headers only, never body.
// Body/UI/buttons: Nunito (400/600/700) — carries all paragraphs and controls.

import type { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Grandstander_700Bold',
  displaySemi: 'Grandstander_600SemiBold',
  displayHeavy: 'Grandstander_800ExtraBold',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;

export type TextSize = 'normal' | 'large' | 'xlarge';

// In-app text-size control is a multiplier in the theme (Section 2).
export const textSizeMultiplier: Record<TextSize, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

export type TypeVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption';

interface TypeSpec {
  fontSize: number;
  fontFamily: string;
  lineHeightFactor: number;
  letterSpacing?: number;
}

// Scale (pt): Display 36 / Title 26 / Heading 21 / Body 18 / Label 16 / Caption 14.
// Headers (Grandstander) get slightly tighter letter-spacing; body line-height ≈ 1.4.
const scale: Record<TypeVariant, TypeSpec> = {
  display: { fontSize: 36, fontFamily: fontFamily.displayHeavy, lineHeightFactor: 1.15, letterSpacing: -0.5 },
  title: { fontSize: 26, fontFamily: fontFamily.display, lineHeightFactor: 1.2, letterSpacing: -0.3 },
  heading: { fontSize: 21, fontFamily: fontFamily.displaySemi, lineHeightFactor: 1.25, letterSpacing: -0.2 },
  body: { fontSize: 18, fontFamily: fontFamily.body, lineHeightFactor: 1.4 },
  label: { fontSize: 16, fontFamily: fontFamily.bodySemiBold, lineHeightFactor: 1.4 },
  caption: { fontSize: 14, fontFamily: fontFamily.body, lineHeightFactor: 1.4 },
};

/**
 * Text style for a variant, scaled by the in-app text-size multiplier.
 * OS font scaling stacks on top via the default `allowFontScaling`.
 */
export function type(variant: TypeVariant, multiplier = 1): TextStyle {
  const spec = scale[variant];
  const fontSize = Math.round(spec.fontSize * multiplier);
  return {
    fontFamily: spec.fontFamily,
    fontSize,
    lineHeight: Math.round(fontSize * spec.lineHeightFactor),
    ...(spec.letterSpacing !== undefined ? { letterSpacing: spec.letterSpacing } : {}),
  };
}
