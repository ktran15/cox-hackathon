import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { MilestoneProgress } from '../../domain/types';
import { useType } from '../theme/TextSizeProvider';
import { color, outline, radius, spacing } from '../theme/tokens';
import { fontFamily } from '../theme/typography';

// A single milestone goal bar (Section, #6): always legible about the goal —
// it states how much is left, fills toward the next threshold, and labels the
// current value and the target underneath. Pure presentation; it reads the
// MilestoneProgress the domain already derived (milestoneProgress).

export interface MilestoneProgressBarProps {
  progress: MilestoneProgress;
  /** Human label for the metric, e.g. "Water" or "CO₂". */
  metricLabel: string;
  /** Unit shown after the values, e.g. "L" or "kg". */
  unit: string;
  /** Decimal places for the readouts (0 for water litres, 1 for CO₂ kg). */
  decimals?: number;
  /** Fill + accent color for this metric. */
  accent: string;
  /** 'ink' on paper (default); 'light' on a deep color band. */
  tone?: 'ink' | 'light';
  style?: StyleProp<ViewStyle>;
}

export function MilestoneProgressBar({
  progress,
  metricLabel,
  unit,
  decimals = 0,
  accent,
  tone = 'ink',
  style,
}: MilestoneProgressBarProps) {
  const labelType = useType('label');
  const captionType = useType('caption');

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const maxed = progress.nextThreshold === null;
  const pct = Math.round(progress.fraction * 100);

  const headline = maxed
    ? `Top ${metricLabel} milestone reached!`
    : `${fmt(progress.toNext)} ${unit} to your next ${metricLabel} milestone`;

  const light = tone === 'light';
  const headlineColor = light ? color.card : color.ink;
  const subColor = light ? color.cream : color.inkSoft;
  // On a deep band the cream secondary text bumps to bold to stay AA-legible.
  const subWeight = light ? styles.subBold : null;

  const goalText = maxed
    ? `${fmt(progress.current)} ${unit}`
    : `Goal ${fmt(progress.nextThreshold as number)} ${unit}`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      accessibilityLabel={`${headline}. ${fmt(progress.current)} ${unit} so far.`}
      style={[styles.wrap, style]}
    >
      <Text style={[labelType, { color: headlineColor }]}>{headline}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.footRow}>
        <Text style={[captionType, { color: subColor }, subWeight]}>
          {fmt(progress.current)} {unit}
        </Text>
        <Text style={[captionType, { color: subColor }, subWeight]}>{goalText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  track: {
    width: '100%',
    height: 14,
    backgroundColor: color.card,
    borderRadius: radius.chip,
    borderWidth: outline.width,
    borderColor: outline.color,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.chip,
  },
  footRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subBold: {
    fontFamily: fontFamily.bodyBold,
  },
});
