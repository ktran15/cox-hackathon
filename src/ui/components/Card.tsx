import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { color, handCut, outline, spacing } from '../theme/tokens';

export interface CardProps extends ViewProps {
  /** Surface color — white content paper by default; pass a bold fill for framing cards. */
  surface?: string;
  /** Varies the hand-cut corner radii so sibling cards don't look identical. */
  seed?: number;
  style?: StyleProp<ViewStyle>;
}

export function Card({ surface = color.card, seed = 0, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: surface,
          padding: spacing.lg,
          borderWidth: outline.width,
          borderColor: outline.color,
          ...handCut(seed),
          ...outline.shadow,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
