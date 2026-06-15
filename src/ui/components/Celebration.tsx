import { useWindowDimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { color } from '../theme/tokens';

// Paper-confetti burst (Section 5.5) — the ONLY celebration lib (Section 3).
// Fully gated by reduce-motion (Section 2): when motion is reduced it renders
// nothing, so a routing success is still complete and usable without it.
export interface CelebrationProps {
  /** Fire the burst when this is true (e.g. on reaching a success state). */
  active: boolean;
}

// Paper-confetti colors from 5.5: sunshine / tomato / grass / blue.
const CONFETTI_COLORS = [color.sunshine, color.tomato, color.grass, color.blue];

export function Celebration({ active }: CelebrationProps) {
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();

  // Snap to final state under reduce motion (no burst at all).
  if (reduceMotion || !active) return null;

  return (
    <ConfettiCannon
      count={80}
      // Rain down from just above the top center, like paper scraps tossed up.
      origin={{ x: width / 2, y: -20 }}
      autoStart
      fadeOut
      explosionSpeed={350}
      fallSpeed={2600}
      colors={CONFETTI_COLORS}
    />
  );
}
