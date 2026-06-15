import { StyleSheet, Text, View } from 'react-native';

import { useType } from '../theme/TextSizeProvider';
import { color, outline, radius, routeColor, spacing, textOn } from '../theme/tokens';

// Keyed off the design tokens so this component needs no domain import.
export type RouteChipRoute = keyof typeof routeColor;

const routeLabel: Record<RouteChipRoute, string> = {
  resell: 'Resell',
  donate: 'Donate',
  recycle: 'Recycle',
};

export interface RouteChipProps {
  route: RouteChipRoute;
  /** Override the default route name, e.g. "Donated!". */
  label?: string;
}

// Paper-tag look (Section 5.5): bold fill, crayon outline, and a punched
// "string hole" on the leading edge like a price tag tied to the garment.
export function RouteChip({ route, label }: RouteChipProps) {
  const captionType = useType('caption');
  const fill = routeColor[route];
  const text = label ?? routeLabel[route];

  return (
    <View
      style={[styles.tag, outline.shadow, { backgroundColor: fill }]}
      accessible
      accessibilityLabel={`Route: ${text}`}
    >
      <View style={styles.hole} />
      <Text style={[captionType, styles.label, { color: textOn(fill) }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.chip,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs + 1,
    alignSelf: 'flex-start',
    gap: spacing.sm - 2,
  },
  hole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.paper,
    borderWidth: 1.5,
    borderColor: outline.color,
  },
  label: {
    fontFamily: 'Nunito_700Bold',
  },
});
