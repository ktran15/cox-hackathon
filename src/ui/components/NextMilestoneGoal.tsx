import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { MilestoneProgress } from '../../domain/types';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { color, spacing } from '../theme/tokens';
import { MilestoneProgressBar } from './MilestoneProgressBar';

// The next-milestone goal (Section, #6): one always-legible progress bar that
// ALTERNATES which track it shows — Water, then CO₂, then back. The two-dot
// indicator tells the user the view rotates and which metric is showing. The
// crossfade and count are gated by reduce-motion (Section 2): the bar still
// alternates, it just swaps instantly with no fade.

const ALTERNATE_MS = 4500;
const FADE_MS = 220;

type Track = 'water' | 'co2';

export interface NextMilestoneGoalProps {
  water: MilestoneProgress;
  co2: MilestoneProgress;
  /** 'ink' on paper (default); 'light' on a deep color band. */
  tone?: 'ink' | 'light';
  style?: StyleProp<ViewStyle>;
}

export function NextMilestoneGoal({ water, co2, tone = 'ink', style }: NextMilestoneGoalProps) {
  const reduceMotion = useReduceMotion();
  const [track, setTrack] = useState<Track>('water');
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const flip = () => setTrack((t) => (t === 'water' ? 'co2' : 'water'));
    const id = setInterval(() => {
      if (reduceMotion) {
        flip(); // instant swap, no fade
        return;
      }
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => {
        flip();
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start();
      });
    }, ALTERNATE_MS);
    return () => clearInterval(id);
  }, [reduceMotion, fade]);

  const bar =
    track === 'water' ? (
      <MilestoneProgressBar
        progress={water}
        metricLabel="Water"
        unit="L"
        decimals={0}
        accent={color.blue}
        tone={tone}
      />
    ) : (
      <MilestoneProgressBar
        progress={co2}
        metricLabel="CO₂"
        unit="kg"
        decimals={1}
        accent={color.seafoam}
        tone={tone}
      />
    );

  const dotColor = (t: Track) => {
    const active = track === t;
    const tint = t === 'water' ? color.blue : color.seafoam;
    if (active) return tint;
    return tone === 'light' ? 'rgba(255,255,255,0.45)' : color.paperDeep;
  };

  return (
    <View style={style}>
      <Animated.View style={reduceMotion ? undefined : { opacity: fade }}>{bar}</Animated.View>
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.dot, { backgroundColor: dotColor('water'), borderColor: color.ink }]} />
        <View style={[styles.dot, { backgroundColor: dotColor('co2'), borderColor: color.ink }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
});
