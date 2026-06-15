import { Trash2 } from 'lucide-react-native';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Garment } from '../../domain/types';
import { useType } from '../theme/TextSizeProvider';
import { color, handCut, outline, spacing } from '../theme/tokens';
import { GradeBadge } from './GradeBadge';
import { RouteChip } from './RouteChip';

// Minimal closet card for the Milestone-4 vertical slice (Section 7.2). Full
// grid polish — filters, colored-paper fill mix — is Milestone 5. Crayon
// outline + hand-cut corners + paper lift, per the design system.
export interface GarmentCardProps {
  garment: Garment;
  onPress?: () => void;
  /** When provided, shows a delete control that confirms before removing. */
  onRemove?: () => void;
  /** Varies the hand-cut radii so neighbouring cards don't look identical. */
  seed?: number;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function GarmentCard({ garment, onPress, onRemove, seed = 0 }: GarmentCardProps) {
  const labelType = useType('label');
  const captionType = useType('caption');
  const routed = garment.route !== undefined && garment.saving !== undefined;
  const name = garment.nickname?.trim() || titleCase(garment.type);

  const confirmRemove = () => {
    if (!onRemove) return;
    // Confirm first — removing also subtracts this garment's saving from the
    // closet totals, so it should never be a one-tap accident.
    Alert.alert(
      'Remove this garment?',
      `${name} will be removed from your closet, and its saved water and CO₂ will come off your totals.`,
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onRemove },
      ],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, condition grade ${garment.grade}${
        routed ? `, ${garment.route}` : ', not routed yet'
      }`}
      style={[styles.card, outline.shadow, handCut(seed)]}
    >
      <View>
        <Image source={{ uri: garment.imageUri }} style={styles.image} resizeMode="cover" />
        {onRemove ? (
          <Pressable
            onPress={confirmRemove}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${name}`}
            style={styles.removeButton}
          >
            <Trash2 color={color.ink} size={18} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[labelType, styles.name]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.badgeRow}>
          <GradeBadge grade={garment.grade} size="small" />
          {routed && garment.route ? <RouteChip route={garment.route} /> : null}
        </View>
        {routed && garment.saving ? (
          <Text style={[captionType, styles.saving]}>
            Saved ~{garment.saving.waterL.toLocaleString()} L · {garment.saving.co2Kg} kg
          </Text>
        ) : (
          <Text style={[captionType, styles.notRouted]}>Not routed yet</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: color.blueSoft,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.cream,
    borderWidth: outline.width,
    borderColor: outline.color,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  name: {
    color: color.ink,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  saving: {
    color: color.inkSoft,
  },
  notRouted: {
    color: color.inkSoft,
    fontStyle: 'italic',
  },
});
