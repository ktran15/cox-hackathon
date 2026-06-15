import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { color, outline } from '../theme/tokens';

// The signature element (Section 5.1): a crayon-drawn plant that grows with
// the parent's level (1 Sprout … 6 Forest). First pass for visual review —
// thick ink outlines, bold fills, slightly asymmetric "hand-drawn" leaf paths.

export interface LevelPlantProps {
  /** Level 1–6; clamped. More level = taller stem, more leaves, level 6 blooms. */
  level: number;
  /** Rendered square size in dp. */
  size?: number;
}

const VIEW = 120; // square viewBox

interface Leaf {
  x: number;
  y: number;
  side: -1 | 1;
  scale: number;
}

function leafPath({ x, y, side, scale }: Leaf): string {
  // A chunky leaf drawn with two quadratic curves; the two control points are
  // intentionally unequal so no leaf looks machine-perfect.
  const len = 20 * scale * side;
  const lift = 9 * scale;
  return [
    `M ${x} ${y}`,
    `Q ${x + len * 0.45} ${y - lift * 1.25} ${x + len} ${y - lift * 0.4}`,
    `Q ${x + len * 0.55} ${y + lift * 0.65} ${x} ${y}`,
    'Z',
  ].join(' ');
}

export function LevelPlant({ level, size = 160 }: LevelPlantProps) {
  const clamped = Math.max(1, Math.min(6, Math.round(level)));
  const reduceMotion = useReduceMotion();

  // The growth moment (Section 5.5): when the level goes UP, the new plant
  // springs in with a small pop — anchored at the pot base so it grows out of
  // the soil rather than inflating from the center. First mount and level
  // decreases render statically; reduce-motion skips the pop entirely.
  const grow = useRef(new Animated.Value(1)).current;
  const prevLevel = useRef(clamped);

  useEffect(() => {
    const grew = clamped > prevLevel.current;
    prevLevel.current = clamped;
    if (!grew || reduceMotion) return;
    grow.setValue(0.92);
    Animated.spring(grow, {
      toValue: 1,
      useNativeDriver: true,
      speed: 14,
      bounciness: 9,
    }).start();
  }, [clamped, grow, reduceMotion]);

  // Emulate a bottom-center transform origin: as the plant scales down, shift
  // it toward the soil line so the pot stays planted.
  const baseAnchor = grow.interpolate({
    inputRange: [0.9, 1],
    outputRange: [size * 0.05, 0],
  });

  const potTopY = 92;
  const stemTop = potTopY - 18 - clamped * 9;
  const stemX = 60;

  // Stem with a gentle lean so it reads drawn, not plotted.
  const stem = `M ${stemX} ${potTopY} Q ${stemX - 4} ${(potTopY + stemTop) / 2} ${stemX + 2} ${stemTop}`;

  const leaves: Leaf[] = [];
  for (let i = 0; i < clamped; i += 1) {
    const t = (i + 1) / (clamped + 1);
    leaves.push({
      x: stemX + (t - 0.5) * 4,
      y: potTopY - (potTopY - stemTop) * t - 2,
      side: i % 2 === 0 ? -1 : 1,
      scale: 0.75 + 0.1 * (i % 3),
    });
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Your plant at level ${clamped} of 6`}
      style={styles.wrap}
    >
      <Animated.View
        style={{ transform: [{ translateY: baseAnchor }, { scale: grow }] }}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
          {/* soil mound */}
          <Path
            d={`M 42 ${potTopY} Q 60 ${potTopY - 7} 78 ${potTopY} Z`}
            fill={color.inkSoft}
            stroke={outline.color}
            strokeWidth={2}
          />
          {/* stem: ink "crayon" underlay + green stroke on top */}
          <Path
            d={stem}
            stroke={outline.color}
            strokeWidth={6.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={stem}
            stroke={color.grass}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
          {/* leaves */}
          {leaves.map((leaf, i) => (
            <Path
              key={i}
              d={leafPath(leaf)}
              fill={i % 2 === 0 ? color.grass : color.pea}
              stroke={outline.color}
              strokeWidth={outline.width}
              strokeLinejoin="round"
            />
          ))}
          {/* level 6 blooms */}
          {clamped === 6 ? (
            <>
              {[0, 72, 144, 216, 288].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <Circle
                    key={deg}
                    cx={stemX + 2 + Math.cos(rad) * 8}
                    cy={stemTop - 6 + Math.sin(rad) * 8}
                    r={5.5}
                    fill={color.sunshine}
                    stroke={outline.color}
                    strokeWidth={2}
                  />
                );
              })}
              <Circle
                cx={stemX + 2}
                cy={stemTop - 6}
                r={4.5}
                fill={color.carrot}
                stroke={outline.color}
                strokeWidth={2}
              />
            </>
          ) : null}
          {/* pot: rim + tapered body, terracotta with ink outline */}
          <Path
            d={`M 38 ${potTopY} L 82 ${potTopY} L 76 ${potTopY + 22} Q 60 ${potTopY + 26} 44 ${potTopY + 22} Z`}
            fill={color.carrot}
            stroke={outline.color}
            strokeWidth={outline.width}
            strokeLinejoin="round"
          />
          <Path
            d={`M 34 ${potTopY - 8} L 86 ${potTopY - 8} L 84 ${potTopY} L 36 ${potTopY} Z`}
            fill={color.squash}
            stroke={outline.color}
            strokeWidth={outline.width}
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
