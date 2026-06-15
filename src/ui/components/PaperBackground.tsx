import { memo, useMemo, type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';

import { mulberry32 } from '../../utils/prng';
import { color } from '../theme/tokens';

// SPEC-NOTE: Section 5.5 prefers a bundled seamless paper.png; no texture
// asset is bundled, so this is the sanctioned procedural branch — layered
// construction-paper grain via react-native-svg. Three tones, all texture-only
// (never used for text or fills elsewhere):
//   - FLECK (paperDeep): pressed-pulp flecks, the body of the grain
//   - FIBER: the "faint warm shadow tone" from 5.5 — short fibers + strands
//   - PULP (cream): brighter pulp specks, the light side of the fiber relief
// Tuning note: density and opacity below are set so the grain is *felt and
// faintly seen* per 5.5 — if it reads flat on a real device, raise the FIBER
// opacities first (they carry most of the visible texture).

const FLECK = color.paperDeep;
const FIBER = '#E8D5B5';
const PULP = color.cream;

interface GrainProps {
  width: number;
  height: number;
}

const Grain = memo(function Grain({ width, height }: GrainProps) {
  const elements = useMemo(() => {
    const random = mulberry32(42);
    const area = width * height;
    const out: ReactNode[] = [];
    let key = 0;

    // Layer 1 — bright pulp specks (under everything, lifts the cream).
    const pulpCount = Math.round(area / 6500);
    for (let i = 0; i < pulpCount; i += 1) {
      out.push(
        <Circle
          key={key++}
          cx={random() * width}
          cy={random() * height}
          r={0.8 + random() * 1.3}
          fill={PULP}
          opacity={0.9}
        />,
      );
    }

    // Layer 2 — pressed-pulp flecks in paperDeep (the body of the grain).
    const fleckCount = Math.round(area / 2300);
    for (let i = 0; i < fleckCount; i += 1) {
      out.push(
        <Circle
          key={key++}
          cx={random() * width}
          cy={random() * height}
          r={0.5 + random() * 1.1}
          fill={FLECK}
          opacity={0.65 + random() * 0.35}
        />,
      );
    }

    // Layer 3 — short fibers in the warm shadow tone: little strands lying in
    // every direction, like the surface of construction paper.
    const fiberCount = Math.round(area / 2800);
    for (let i = 0; i < fiberCount; i += 1) {
      const cx = random() * width;
      const cy = random() * height;
      const angle = random() * Math.PI;
      const half = (4.5 + random() * 8) / 2;
      const dx = Math.cos(angle) * half;
      const dy = Math.sin(angle) * half;
      out.push(
        <Line
          key={key++}
          x1={cx - dx}
          y1={cy - dy}
          x2={cx + dx}
          y2={cy + dy}
          stroke={FIBER}
          strokeWidth={0.7 + random() * 0.5}
          strokeLinecap="round"
          opacity={0.4 + random() * 0.3}
        />,
      );
    }

    // Layer 4 — occasional longer soft strands (the big visible fibers you
    // notice when you hold construction paper up close).
    const strandCount = Math.round(area / 14000);
    for (let i = 0; i < strandCount; i += 1) {
      const cx = random() * width;
      const cy = random() * height;
      out.push(
        <Ellipse
          key={key++}
          cx={cx}
          cy={cy}
          rx={2.4 + random() * 2.2}
          ry={0.7 + random() * 0.5}
          fill={FIBER}
          opacity={0.3 + random() * 0.2}
          transform={`rotate(${Math.round(random() * 180)} ${cx} ${cy})`}
        />,
      );
    }

    return out;
  }, [width, height]);

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      aria-hidden
    >
      {elements}
    </Svg>
  );
});

export interface PaperBackgroundProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PaperBackground({ children, style }: PaperBackgroundProps) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.base, style]}>
      <Grain width={width} height={height} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: color.paper,
  },
});
