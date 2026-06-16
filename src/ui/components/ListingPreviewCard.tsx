import { StyleSheet, Text, View } from 'react-native';

import type { Listing } from '../../data/services/handoffService';
import { useType } from '../theme/TextSizeProvider';
import { color, outline, radius, routeColor, spacing, textOn } from '../theme/tokens';
import { Card } from './Card';

// ListingPreviewCard (Section 7.6): the auto-filled resell listing the parent
// will copy or share. Cream paper card with a crayon outline; the suggested
// price band reads as a bold grass-colored tag (resell color, 5.8), or a calm
// note when resell isn't suggested for the condition (grade C/D).
export interface ListingPreviewCardProps {
  listing: Listing;
}

export function ListingPreviewCard({ listing }: ListingPreviewCardProps) {
  const headingType = useType('heading');
  const bodyType = useType('body');
  const labelType = useType('label');
  const captionType = useType('caption');

  return (
    <Card surface={color.cream} seed={6} style={styles.card}>
      <Text style={[captionType, styles.kicker]}>Your listing</Text>
      <Text style={[headingType, styles.title]}>{listing.title}</Text>
      <Text style={[bodyType, styles.condition]}>{listing.condition}</Text>

      {listing.priceBand ? (
        <View style={styles.priceRow}>
          <Text style={[captionType, styles.priceLabel]}>Suggested price</Text>
          <View style={[styles.priceTag, { backgroundColor: routeColor.resell }]}>
            <Text style={[labelType, { color: textOn(routeColor.resell) }]}>
              {listing.priceBand}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={[captionType, styles.noPrice]}>
          Resell isn’t suggested for this condition, but you can still try.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  kicker: {
    color: color.inkSoft,
  },
  title: {
    color: color.ink,
  },
  condition: {
    color: color.ink,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  priceLabel: {
    color: color.inkSoft,
  },
  priceTag: {
    borderRadius: radius.chip,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...outline.shadow,
  },
  noPrice: {
    color: color.inkSoft,
    marginTop: spacing.xs,
  },
});
