import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { mulberry32 } from '../../utils/prng';

// Torn-paper seam (Section 5.5): where a large colored block meets the cream,
// this renders a slightly irregular deckle edge so the block looks ripped from
// construction paper. Big seams only (headers, impact bands, dividers) — never
// on every card.

export interface TornEdgeProps {
  /** Fill — the color of the paper block this edge belongs to. */
  color: string;
  /**
   * Which edge of the colored block this is: 'top' tears upward into the
   * surface above it; 'bottom' tears downward below the block.
   */
  side: 'top' | 'bottom';
  /** Edge height in dp (default 12). */
  height?: number;
  /** Varies the tear so two seams never rip identically. */
  seed?: number;
  style?: StyleProp<ViewStyle>;
}

const VIEW_W = 360;
const VIEW_H = 12;

export function TornEdge({
  color: fill,
  side,
  height = 12,
  seed = 0,
  style,
}: TornEdgeProps) {
  const { d, specks } = useMemo(() => {
    const random = mulberry32(seed * 7919 + 23);
    // 'top' tears live near y=0 with the solid base at y=VIEW_H; 'bottom'
    // mirrors. orient() flips raw tear depths into the right frame.
    const orient = (y: number) => (side === 'top' ? y : VIEW_H - y);
    const base = side === 'top' ? VIEW_H : 0;

    // Walk across in small irregular steps, jittering the tear depth, then
    // smooth through midpoints so the rip reads soft-fibered, not jagged.
    const points: { x: number; y: number }[] = [
      { x: 0, y: 2.5 + random() * (VIEW_H - 6) },
    ];
    let x = 0;
    while (x < VIEW_W) {
      x = Math.min(VIEW_W, x + 9 + random() * 16);
      points.push({ x, y: 2 + random() * (VIEW_H - 5.5) });
    }
    const parts = [`M 0 ${base}`, `L 0 ${orient(points[0].y)}`];
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const cur = points[i];
      parts.push(
        `Q ${prev.x} ${orient(prev.y)} ${(prev.x + cur.x) / 2} ${orient((prev.y + cur.y) / 2)}`,
      );
    }
    const last = points[points.length - 1];
    parts.push(`L ${VIEW_W} ${orient(last.y)}`, `L ${VIEW_W} ${base}`, 'Z');

    // A few torn-off bits floating just past the edge sell the rip.
    const bits: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < 7; i += 1) {
      bits.push({
        x: random() * VIEW_W,
        y: orient(0.7 + random() * 1.4),
        r: 0.5 + random() * 0.9,
      });
    }
    return { d: parts.join(' '), specks: bits };
  }, [seed, side]);

  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      pointerEvents="none"
      aria-hidden
      style={style}
    >
      <Path d={d} fill={fill} />
      {specks.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={fill} />
      ))}
    </Svg>
  );
}
