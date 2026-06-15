import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useType } from '../theme/TextSizeProvider';
import { color, outline, radius, tapTarget } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Rounds the button into the 30-radius CTA pill (primary CTAs only). */
  pill?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Optional icon rendered before the label. Key actions are never icon-only. */
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  pill = false,
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const reduceMotion = useReduceMotion();
  const labelType = useType('label');
  // Paper-press (Section 5.5): squash to 0.96 and sink 1px, like pressing a
  // paper button. Driven together so reduce-motion can skip both.
  const press = useRef(new Animated.Value(0)).current;

  // Asymmetric press: the squash is immediate (feedback while the finger is
  // down); the release springs back with a slight paper pop.
  const pressIn = () => {
    if (reduceMotion) return;
    Animated.timing(press, {
      toValue: 1,
      duration: 90,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    if (reduceMotion) return;
    Animated.spring(press, {
      toValue: 0,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  };

  const textColor = disabled
    ? color.inkSoft
    : variant === 'primary'
      ? '#FFFFFF'
      : color.ink;
  const spinnerColor = variant === 'primary' ? '#FFFFFF' : color.ink;
  const outlined = variant !== 'ghost';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={style}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.base,
            pill && styles.pill,
            outlined && styles.outlined,
            // Paper lift closes when pressed: the button sinks toward its own
            // shadow, so the offset flattens with the squash.
            outlined &&
              !disabled &&
              (pressed ? styles.pressedShadow : outline.shadow),
            variantStyle(variant, pressed),
            disabled && styles.disabled,
            {
              transform: [
                {
                  scale: press.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.96],
                  }),
                },
                {
                  translateY: press.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={spinnerColor} />
          ) : (
            <>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
              <Text style={[labelType, styles.label, { color: textColor }]}>
                {label}
              </Text>
            </>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

function variantStyle(variant: ButtonVariant, pressed: boolean): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: pressed ? color.blueDeep : color.blue };
    case 'secondary':
      return { backgroundColor: pressed ? color.paperDeep : color.card };
    case 'ghost':
      return { backgroundColor: pressed ? color.paperDeep : 'transparent' };
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: tapTarget.primary,
    borderRadius: radius.button,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  pill: {
    borderRadius: radius.pill,
  },
  outlined: {
    borderWidth: outline.width,
    borderColor: outline.color,
  },
  disabled: {
    backgroundColor: color.paperDeep,
    borderColor: color.inkSoft,
  },
  pressedShadow: {
    shadowColor: outline.shadow.shadowColor,
    shadowOpacity: outline.shadow.shadowOpacity,
    shadowRadius: 0,
    shadowOffset: { width: 1, height: 2 },
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    textAlign: 'center',
  },
});
