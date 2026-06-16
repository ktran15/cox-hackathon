import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBadgeStore } from '@/src/data/stores/badgeStore';
import { BADGES, type BadgeId } from '@/src/domain/constants';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { badgeMeta } from '../badges/badgeMeta';
import { useType } from '../theme/TextSizeProvider';
import { color, outline, radius, spacing, textOn } from '../theme/tokens';
import { Celebration } from './Celebration';

// Global badge celebration (Section 7.9): earning a badge ANYWHERE in the app
// triggers a paper-confetti burst plus a toast naming it. Mounted once at the
// root, it watches the badge store for newly added unlocks. Confetti is gated
// by reduce-motion (via Celebration); the toast still appears (it's
// information, not motion) but skips its fade when motion is reduced.

const TOAST_MS = 3600;

const badgeTitle = (id: string): string => BADGES.find((b) => b.id === id)?.title ?? id;

interface ActiveToast {
  id: BadgeId;
  extra: number; // how many more were earned in the same batch
}

export function BadgeCelebrationHost() {
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const labelType = useType('label');
  const captionType = useType('caption');

  const earned = useBadgeStore((s) => s.earned);
  const prevCount = useRef(earned.length);
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const [confetti, setConfetti] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const grew = earned.length > prevCount.current;
    const added = earned.slice(prevCount.current);
    prevCount.current = earned.length;
    if (!grew || added.length === 0) return undefined;

    const newest = added[added.length - 1].id as BadgeId;
    setToast({ id: newest, extra: added.length - 1 });
    setConfetti(true);

    if (reduceMotion) {
      opacity.setValue(1);
    } else {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }

    const timer = setTimeout(() => {
      const clear = () => {
        setToast(null);
        setConfetti(false);
      };
      if (reduceMotion) {
        clear();
      } else {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }).start(clear);
      }
    }, TOAST_MS);
    return () => clearTimeout(timer);
  }, [earned, reduceMotion, opacity]);

  if (!toast) {
    // Confetti may still be cleaning up; render it alone if so.
    return <Celebration active={confetti} />;
  }

  const meta = badgeMeta[toast.id];
  const { Icon, accent } = meta;
  const title = badgeTitle(toast.id);

  return (
    <View style={styles.host} pointerEvents="none">
      <Celebration active={confetti} />
      <Animated.View
        style={[styles.toastWrap, { top: insets.top + spacing.sm, opacity }]}
      >
        <View
          accessibilityRole="alert"
          accessibilityLabel={`New badge unlocked: ${title}`}
          style={[styles.toast, outline.shadow]}
        >
          <View style={[styles.iconChip, { backgroundColor: accent }]}>
            <Icon color={textOn(accent)} size={22} strokeWidth={2.5} />
          </View>
          <View style={styles.toastText}>
            <Text style={[captionType, styles.kicker]}>New badge unlocked</Text>
            <Text style={[labelType, styles.title]} numberOfLines={1}>
              {title}
              {toast.extra > 0 ? ` +${toast.extra} more` : ''}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
  },
  toastWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: color.cream,
    borderRadius: radius.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    transform: [{ rotate: '-1deg' }],
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: outline.width,
    borderColor: outline.color,
  },
  toastText: {
    flexShrink: 1,
  },
  kicker: {
    color: color.inkSoft,
  },
  title: {
    color: color.ink,
  },
});
