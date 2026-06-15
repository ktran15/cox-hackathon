import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { color, outline } from '../theme/tokens';

// Hammie — the Hand-Me-Up mascot (design spec, Section 5 "Cut-Paper Classroom").
// He's a friendly little sprout fully zipped into a kids' onesie: a green head
// with a leafy sprout growing from the top, a bold construction-paper bodysuit
// that covers his whole body, and just his two little feet poking out the
// bottom. Built entirely from react-native-svg + core Animated (no web
// techniques, per Section 5.7). He/him in all copy.
//
// Onesie fit (Section, redraw): the suit covers his ENTIRE body — only his head
// (with the prominent leaf-sprout on top) and his feet stick out. No green
// torso shows between the head and the suit.

const AnimatedView = Animated.View;

// Taller than wide so the sprout has room to grow above his head.
const VIEW_W = 120;
const VIEW_H = 140;
const ASPECT = VIEW_H / VIEW_W;

export type HammieGrowthStage = 1 | 2 | 3;
export type HammieOnesieColor = 'blue' | 'sunshine';
export type HammieMotion = 'idle' | 'bounce' | 'grow';

export interface HammieProps {
  /** Rendered width in dp; height is derived from the character's aspect ratio. */
  size?: number;
  /**
   * How leafy his sprout is: 1 single leaf, 2 two leaves, 3 full crown with a
   * bloom. Hammie is a constant mascot (Section, #4) so this defaults to his
   * full, happiest crown; the prop exists mainly for the dev gallery.
   */
  growthStage?: HammieGrowthStage;
  /** Onesie color — a bold brand fill. Defaults to the anchor Gerber blue. */
  onesieColor?: HammieOnesieColor;
  /**
   * Motion personality. `idle` is a calm continuous breathing sway; `bounce` is
   * a one-shot happy hop (when a garment is routed); `grow` is a one-shot scale
   * pop. All motion no-ops under reduce-motion (Section 2).
   */
  motion?: HammieMotion;
  /** Bump this to replay a one-shot `bounce`/`grow`. Ignored by `idle`. */
  playKey?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

interface Leaf {
  x: number;
  y: number;
  side: -1 | 1;
  scale: number;
}

// Hand-placed crown per growth stage, sitting ABOVE his head (head top ≈ y30).
// Curated rather than generated, because this is the character the app is
// remembered by (Section 5.1).
const CROWN: Record<
  HammieGrowthStage,
  { stemTop: number; leaves: Leaf[]; bloom: boolean }
> = {
  1: {
    stemTop: 18,
    leaves: [{ x: 60, y: 24, side: -1, scale: 0.9 }],
    bloom: false,
  },
  2: {
    stemTop: 13,
    leaves: [
      { x: 60, y: 26, side: -1, scale: 0.95 },
      { x: 60, y: 17, side: 1, scale: 1.0 },
    ],
    bloom: false,
  },
  3: {
    stemTop: 9,
    leaves: [
      { x: 60, y: 28, side: -1, scale: 0.96 },
      { x: 60, y: 19, side: 1, scale: 1.06 },
      { x: 60, y: 11, side: -1, scale: 0.82 },
    ],
    bloom: true,
  },
};

// A chunky leaf, two unequal quadratics so no leaf looks machine-perfect.
function leafPath({ x, y, side, scale }: Leaf): string {
  const len = 22 * scale * side;
  const lift = 11 * scale;
  return [
    `M ${x} ${y}`,
    `Q ${x + len * 0.45} ${y - lift * 1.3} ${x + len} ${y - lift * 0.4}`,
    `Q ${x + len * 0.55} ${y + lift * 0.6} ${x} ${y}`,
    'Z',
  ].join(' ');
}

// A short midrib so larger leaves read as drawn, not stamped.
function midribPath({ x, y, side, scale }: Leaf): string {
  const len = 22 * scale * side;
  const lift = 11 * scale;
  return `M ${x} ${y} Q ${x + len * 0.4} ${y - lift * 0.5} ${x + len * 0.8} ${y - lift * 0.45}`;
}

// Onesie outlines are a touch heavier than the 2.5dp UI outline so the "crayon"
// weight survives when Hammie shrinks to an icon. SPEC-NOTE: 2.5 is the
// component-outline token; an illustration needs slightly more in viewBox units.
const STROKE = 3;

// Single-path bodysuit covering the WHOLE body: scoop neck under the head, two
// short-sleeve caps, a full torso, two leg cuffs with a crotch notch. One fill
// + one outline = one clean shape; his head sits above it and his feet below.
const ONESIE = [
  'M 38 72',
  'Q 60 82 82 72', // scoop neckline tucked under the head
  'Q 90 69 95 79', // right sleeve cap (up + out)
  'Q 99 89 87 92', // right underarm back in
  'Q 92 106 89 115', // right torso side down to the hip
  'Q 88 124 77 124', // right leg outer + cuff
  'L 65 124',
  'L 60 110', // up into the crotch notch
  'L 55 124',
  'L 43 124',
  'Q 32 124 31 115', // left leg outer cuff
  'Q 28 106 33 92', // left torso side
  'Q 21 89 25 79', // left underarm
  'Q 30 69 38 72', // left sleeve cap back to the neck
  'Z',
].join(' ');

export function Hammie({
  size = 120,
  growthStage = 3,
  onesieColor = 'blue',
  motion = 'idle',
  playKey = 0,
  style,
  accessibilityLabel = 'Hammie, the Hand-Me-Up sprout',
}: HammieProps) {
  const reduceMotion = useReduceMotion();

  // One value per motion personality keeps the transforms easy to reason about.
  const bob = useRef(new Animated.Value(0)).current; // idle: 0..1 loop
  const hop = useRef(new Animated.Value(0)).current; // bounce: 0..1..0
  const pop = useRef(new Animated.Value(1)).current; // grow: 0.9 -> 1 (overshoot)

  useEffect(() => {
    if (reduceMotion) return undefined;

    if (motion === 'idle') {
      // A slow, gentle breathing sway — felt more than seen. ease-in-out so it
      // never snaps at the turns.
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bob, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }

    if (motion === 'bounce') {
      // A happy hop: a quick spring up, then a springy landing that settles.
      hop.setValue(0);
      Animated.sequence([
        Animated.timing(hop, {
          toValue: 1,
          duration: 170,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(hop, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 14,
        }),
      ]).start();
      return undefined;
    }

    // motion === 'grow': a scale pop anchored at his feet. Never from scale(0).
    pop.setValue(0.9);
    Animated.spring(pop, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 12,
    }).start();
    return undefined;
  }, [motion, playKey, reduceMotion, bob, hop, pop]);

  // Compose the active transform per motion. Reduce-motion renders him at rest.
  const idleStyle = {
    transform: [
      { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [1, -3] }) },
      { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-1deg', '1.2deg'] }) },
    ],
  };
  const bounceStyle = {
    transform: [
      { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
      { scaleX: hop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
      { scaleY: hop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
    ],
  };
  // Keep his feet planted while he pops by nudging down as he scales down.
  const growStyle = {
    transform: [
      {
        translateY: pop.interpolate({
          inputRange: [0.9, 1],
          outputRange: [size * 0.06, 0],
          extrapolate: 'clamp' as const,
        }),
      },
      { scale: pop },
    ],
  };
  const motionStyle = reduceMotion
    ? undefined
    : motion === 'idle'
      ? idleStyle
      : motion === 'bounce'
        ? bounceStyle
        : growStyle;

  const crown = CROWN[growthStage];
  const headTopY = 31;
  const stemMidY = (headTopY + crown.stemTop) / 2;
  // A stem with a slight left bow so it reads hand-drawn, not plotted.
  const stem = `M 60 ${headTopY} Q 57 ${stemMidY} 60 ${crown.stemTop}`;

  const onesieFill = onesieColor === 'sunshine' ? color.sunshine : color.blue;
  const trimColor = onesieColor === 'sunshine' ? color.carrot : color.blueDeep;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.wrap, style]}
    >
      <AnimatedView style={motionStyle}>
        <Svg width={size} height={size * ASPECT} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          {/* Sprout crown: ink underlay + green stem, then leaves, above his head. */}
          <Path d={stem} stroke={outline.color} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d={stem} stroke={color.grass} strokeWidth={3} strokeLinecap="round" fill="none" />
          {crown.leaves.map((leaf, i) => (
            <Path
              key={`leaf-${i}`}
              d={leafPath(leaf)}
              fill={i % 2 === 0 ? color.grass : color.pea}
              stroke={outline.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          ))}
          {crown.leaves
            .filter((l) => l.scale >= 0.9)
            .map((leaf, i) => (
              <Path
                key={`midrib-${i}`}
                d={midribPath(leaf)}
                stroke={outline.color}
                strokeWidth={1.4}
                strokeLinecap="round"
                fill="none"
                opacity={0.55}
              />
            ))}
          {crown.bloom ? (
            <Circle
              cx={60}
              cy={crown.stemTop - 1}
              r={5}
              fill={color.sunshine}
              stroke={outline.color}
              strokeWidth={2.5}
            />
          ) : null}

          {/* Head — a single green circle. Only the top half shows above the
              onesie collar; the lower half is covered by the suit. */}
          <Circle
            cx={60}
            cy={54}
            r={24}
            fill={color.grass}
            stroke={outline.color}
            strokeWidth={STROKE}
          />

          {/* Feet — little green nubs, drawn BEFORE the onesie so the leg cuffs
              overlap their tops and only the rounded bottoms poke out. */}
          <Circle cx={50} cy={128} r={6.5} fill={color.grass} stroke={outline.color} strokeWidth={STROKE} />
          <Circle cx={70} cy={128} r={6.5} fill={color.grass} stroke={outline.color} strokeWidth={STROKE} />

          {/* The onesie — covers his whole body. */}
          <Path d={ONESIE} fill={onesieFill} stroke={outline.color} strokeWidth={STROKE} strokeLinejoin="round" />
          {/* Neckline ribbing trim — a thin collar line just inside the scoop. */}
          <Path d="M 38 72 Q 60 82 82 72" stroke={trimColor} strokeWidth={1.8} strokeLinecap="round" fill="none" />
          {/* Crotch snaps — the detail that makes "this is a onesie" unmistakable. */}
          {[54, 60, 66].map((cx) => (
            <Circle
              key={`snap-${cx}`}
              cx={cx}
              cy={117}
              r={1.9}
              fill={color.cream}
              stroke={outline.color}
              strokeWidth={1.4}
            />
          ))}

          {/* Face — restrained: two ink dot eyes with a tiny catchlight, and a
              small upturned smile, all on the visible upper head. */}
          <Circle cx={52} cy={52} r={3.3} fill={outline.color} />
          <Circle cx={68} cy={52} r={3.3} fill={outline.color} />
          <Circle cx={53.1} cy={50.9} r={1} fill={color.cream} />
          <Circle cx={69.1} cy={50.9} r={1} fill={color.cream} />
          <Path
            d="M 51 61 Q 60 68 69 61"
            stroke={outline.color}
            strokeWidth={2.6}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
