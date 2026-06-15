// Design tokens — Section 5.3 "Cut-Paper Classroom". Use these exact values.
// Body text is always Ink. Outlines are always Ink. Surfaces are warm paper,
// never flat white backgrounds.

export const color = {
  // Ink — outlines + primary text (warm near-black navy, like a marker)
  ink: '#23323D',
  inkSoft: '#5A6B76',

  // Base — Gerber-inspired blue (anchor)
  blue: '#1F84C9',
  blueDeep: '#13608F', // pressed
  blueSoft: '#CFE8F7', // paper fill

  // Primary classroom pops (bold, confident fills)
  sunshine: '#FFC23C', // yellow
  tomato: '#EF5B45', // red-orange
  grass: '#5FB84A', // green
  grape: '#8C5BAA', // purple
  bubblegum: '#F074A0', // pink

  // Baby-food supporting accents
  carrot: '#F4922E',
  pea: '#9ACb4E',
  squash: '#FBC078',
  seafoam: '#2FB7A3',

  // Paper surfaces (texture sits on these — NOT flat white)
  paper: '#FBF3E4', // app background base (warm cream)
  paperDeep: '#F3E7D0', // alt cream band
  card: '#FFFFFF', // inner content paper (kept white for legibility)
  cream: '#FFF7EC',

  // Feedback
  success: '#3FA66A',
  warning: '#E08A1E',
  danger: '#D2502F',
} as const;

// Condition grade = sticker color
export const gradeColor = {
  A: color.grass,
  B: color.blue,
  C: color.sunshine,
  D: color.grape,
} as const;

// Destination route = tag color
export const routeColor = {
  resell: color.grass,
  donate: color.bubblegum,
  recycle: color.seafoam,
} as const;

// The crayon-outline system (use everywhere)
export const outline = {
  width: 2.5,
  color: color.ink,
  // soft paper-lift shadow to pair with the outline
  shadow: {
    shadowColor: '#23323D',
    shadowOpacity: 0.16,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 4,
  },
} as const;

// Per the contrast notes in Section 5.3: white/cream text on the bold fills,
// Ink text on the light/yellow fills and all paper surfaces.
const onColor: Record<string, string> = {
  [color.blue]: '#FFFFFF',
  [color.blueDeep]: '#FFFFFF',
  [color.tomato]: '#FFFFFF',
  [color.grass]: '#FFFFFF',
  [color.grape]: '#FFFFFF',
  [color.bubblegum]: '#FFFFFF',
  [color.seafoam]: '#FFFFFF',
  [color.success]: '#FFFFFF',
  [color.danger]: '#FFFFFF',
  [color.sunshine]: color.ink,
  [color.pea]: color.ink,
  [color.squash]: color.ink,
  [color.carrot]: color.ink,
};

/** Readable text color for a given fill (defaults to Ink on paper/light fills). */
export function textOn(fill: string): string {
  return onColor[fill] ?? color.ink;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  card: 24, // base; real cards vary per corner via handCut()
  button: 18,
  pill: 30, // primary CTA pill
  chip: 999,
} as const;

export interface HandCutRadii {
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomRightRadius: number;
  borderBottomLeftRadius: number;
}

/**
 * Hand-cut imperfection (Section 5.1 #3): chunky corner radii that are NOT all
 * identical, deterministically varied by seed so cards read as cut by hand.
 */
export function handCut(seed = 0, base: number = radius.card): HandCutRadii {
  const vary = (corner: number) => base - 4 + ((seed * 7 + corner * 13) % 9);
  return {
    borderTopLeftRadius: vary(0),
    borderTopRightRadius: vary(1),
    borderBottomRightRadius: vary(2),
    borderBottomLeftRadius: vary(3),
  };
}

/**
 * Sticker tilt (Section 5.5): a tiny deterministic rotation between -2° and +2°
 * so stickers look peeled-and-stuck, not generated. Curated fractional angles —
 * never 0° (a perfectly straight sticker next to tilted ones reads machine-placed)
 * and never whole degrees (integers read plotted, not hand-stuck).
 */
const tilts = [-2, -1.4, 0.8, 1.6, 2.1] as const;
export function stickerTilt(seed = 0): string {
  return `${tilts[Math.abs(seed * 11) % tilts.length]}deg`;
}

// Accessibility mandate (Section 2): minimum tap target 48dp; primary buttons ≥56dp.
export const tapTarget = {
  min: 48,
  primary: 56,
} as const;
