import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTextSize } from '../theme/TextSizeProvider';
import { fontFamily, type as typeStyle } from '../theme/typography';
import { color, spacing } from '../theme/tokens';

export interface ImpactStatProps {
  /** Final value the number counts up to. */
  value: number;
  /** Unit shown after the number, e.g. "L" or "kg". */
  unit?: string;
  /** What the number means, e.g. "Water saved". */
  label: string;
  /** Decimal places to show (default 0). */
  decimals?: number;
  size?: 'compact' | 'hero';
  /**
   * 'ink' (default) on paper surfaces; 'light' on deep color bands (5.8) —
   * white number, cream secondary text.
   */
  tone?: 'ink' | 'light';
}

const COUNT_UP_MS = 800;

export function ImpactStat({
  value,
  unit,
  label,
  decimals = 0,
  size = 'hero',
  tone = 'ink',
}: ImpactStatProps) {
  const reduceMotion = useReduceMotion();
  const { multiplier } = useTextSize();
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    // Reduce motion (Section 2): skip the count-up and snap to the final value.
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const listener = animated.addListener(({ value: v }) => setDisplay(v));
    Animated.timing(animated, {
      toValue: value,
      duration: COUNT_UP_MS,
      // Strong ease-out: the number races up, then settles digit by digit.
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: false, // drives a text value, not a transform
    }).start(() => setDisplay(value));
    return () => animated.removeListener(listener);
  }, [animated, reduceMotion, value]);

  const numberType = typeStyle(
    size === 'hero' ? 'display' : 'heading',
    multiplier,
  );
  const unitType = typeStyle(size === 'hero' ? 'heading' : 'label', multiplier);
  const labelType = typeStyle(
    size === 'hero' ? 'label' : 'caption',
    multiplier,
  );
  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const light = tone === 'light';
  const numberColor = light ? color.card : color.ink;
  const subColor = light ? color.cream : color.inkSoft;
  // 5.8 guardrail: on deep fills the cream secondary text bumps to bold so it
  // qualifies as WCAG large text against the band color (Nunito 700 ≥ 14pt).
  const subWeight = light ? { fontFamily: fontFamily.bodyBold } : null;
  // Hero units render in Grandstander (already large text); compact units are
  // 16pt Nunito and need the bold bump on deep fills.
  const unitWeight = light && size === 'compact' ? subWeight : null;

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value.toLocaleString(undefined, {
        maximumFractionDigits: decimals,
      })}${unit ? ` ${unit}` : ''}`}
    >
      <View style={styles.numberRow}>
        <Text style={[numberType, styles.number, { color: numberColor }]}>
          {formatted}
        </Text>
        {unit ? (
          <Text style={[unitType, { color: subColor }, unitWeight]}>{unit}</Text>
        ) : null}
      </View>
      <Text style={[labelType, styles.label, { color: subColor }, subWeight]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  number: {
    // Fixed-width digits so the number doesn't jitter while counting up.
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: 2,
  },
});
