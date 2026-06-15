import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useType } from '../theme/TextSizeProvider';
import { color, outline, spacing } from '../theme/tokens';
import { Button } from './Button';

export interface EmptyStateProps {
  /** Drawn icon (thick-stroke lucide in ink) shown in the die-cut paper circle. No emoji (5.2). */
  icon?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const headingType = useType('heading');
  const bodyType = useType('body');

  return (
    <View style={styles.container}>
      {icon ? <View style={[styles.iconCircle, outline.shadow]}>{icon}</View> : null}
      <Text accessibilityRole="header" style={[headingType, styles.title]}>
        {title}
      </Text>
      <Text style={[bodyType, styles.message]}>{message}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} pill style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    transform: [{ rotate: '-1.5deg' }],
  },
  title: {
    color: color.ink,
    textAlign: 'center',
  },
  message: {
    color: color.inkSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
