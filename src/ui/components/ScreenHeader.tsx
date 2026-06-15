import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useType } from '../theme/TextSizeProvider';
import { color, spacing } from '../theme/tokens';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional element on the trailing edge (e.g. a small action). */
  right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  const titleType = useType('title');
  const bodyType = useType('body');

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text accessibilityRole="header" style={[titleType, styles.title]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[bodyType, styles.subtitle]}>{subtitle}</Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  text: {
    flex: 1,
  },
  title: {
    color: color.ink,
  },
  subtitle: {
    color: color.inkSoft,
    marginTop: spacing.xs,
  },
});
