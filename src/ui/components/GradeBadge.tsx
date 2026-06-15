import { StyleSheet, Text, View } from 'react-native';

import { useTextSize } from '../theme/TextSizeProvider';
import { type as typeStyle } from '../theme/typography';
import { color, gradeColor, outline, spacing, stickerTilt, textOn } from '../theme/tokens';

// Keyed off the design tokens so this component needs no domain import.
// The plain-language status copy lives in the domain layer (grading-rules,
// Milestone 2) and is passed in as `label` — never hardcoded here twice.
export type GradeBadgeGrade = keyof typeof gradeColor;

export interface GradeBadgeProps {
  grade: GradeBadgeGrade;
  /** Plain-language status, e.g. "Like new!" — shown beside the sticker. */
  label?: string;
  size?: 'small' | 'large';
}

// Sticker look (Section 5.5): filled grade color, thick ink outline, a thin
// inner white "die-cut" ring, and a tiny tilt so it reads peel-and-stick.
export function GradeBadge({ grade, label, size = 'small' }: GradeBadgeProps) {
  const { multiplier } = useTextSize();
  const fill = gradeColor[grade];
  const letterColor = textOn(fill);
  const diameter = size === 'large' ? 72 : 36;
  const tilt = stickerTilt(grade.charCodeAt(0));
  const letterType = typeStyle(size === 'large' ? 'title' : 'label', multiplier);
  const labelType = typeStyle(size === 'large' ? 'heading' : 'caption', multiplier);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={label ? `Condition: ${label}` : `Condition grade ${grade}`}
    >
      <View
        style={[
          styles.sticker,
          outline.shadow,
          {
            backgroundColor: fill,
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            transform: [{ rotate: tilt }],
          },
        ]}
      >
        <View style={[styles.dieCutRing, { borderRadius: diameter / 2 }]} />
        <Text
          style={[
            letterType,
            styles.letter,
            { color: letterColor, fontFamily: 'Grandstander_800ExtraBold' },
          ]}
        >
          {grade}
        </Text>
      </View>
      {label ? <Text style={[labelType, styles.label]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sticker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: outline.width,
    borderColor: outline.color,
  },
  dieCutRing: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 2.5,
    bottom: 2.5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  letter: {
    // Grandstander sits high in its line box; no line height keeps it centered.
    lineHeight: undefined,
  },
  label: {
    color: color.ink,
    flexShrink: 1,
  },
});
