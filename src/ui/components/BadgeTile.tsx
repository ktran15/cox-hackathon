import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useType } from '../theme/TextSizeProvider';
import { color, outline, spacing, stickerTilt, textOn } from '../theme/tokens';

// BadgeTile (Section 5.6 / 7.9). Earned = peel-and-stick sticker: bold fill,
// thick ink outline, thin inner die-cut ring, a tiny tilt. Locked = an
// ink-outline silhouette on cream paper, clearly "not yet" — same footprint so
// the grid reads evenly. No emoji; the icon is a thick-stroke lucide drawing.
export interface BadgeTileProps {
  title: string;
  Icon: LucideIcon;
  accent: string;
  earned: boolean;
  onPress?: () => void;
  /** Varies the earned sticker tilt so neighbours don't look identical. */
  seed?: number;
  /** Sticker diameter in dp. */
  size?: number;
}

export function BadgeTile({
  title,
  Icon,
  accent,
  earned,
  onPress,
  seed = 0,
  size = 76,
}: BadgeTileProps) {
  const captionType = useType('caption');

  const fill = earned ? accent : color.paperDeep;
  const iconColor = earned ? textOn(accent) : color.inkSoft;
  const tilt = earned ? stickerTilt(seed) : '0deg';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${earned ? 'earned' : 'locked'}`}
      style={styles.wrap}
    >
      <View
        style={[
          styles.sticker,
          earned ? outline.shadow : null,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fill,
            transform: [{ rotate: tilt }],
          },
        ]}
      >
        {earned ? <View style={[styles.dieCut, { borderRadius: size / 2 }]} /> : null}
        <Icon color={iconColor} size={size * 0.42} strokeWidth={2.5} />
      </View>
      <Text
        numberOfLines={2}
        style={[captionType, styles.title, { color: earned ? color.ink : color.inkSoft }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  sticker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: outline.width,
    borderColor: outline.color,
  },
  dieCut: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  title: {
    textAlign: 'center',
  },
});
