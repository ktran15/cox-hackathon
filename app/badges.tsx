import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBadgeStore } from '@/src/data/stores/badgeStore';
import { BADGES, type BadgeId } from '@/src/domain/constants';
import { badgeMeta } from '@/src/ui/badges/badgeMeta';
import { BadgeTile, Button, PaperBackground } from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, outline, radius, spacing } from '@/src/ui/theme/tokens';

// Badges (Section 7.9). The full catalogue as a grid — earned stickers in color,
// locked ones as ink silhouettes. Tapping any badge opens a detail sheet with
// its icon, title, description, and how to earn it. New badges celebrate via the
// global BadgeCelebrationHost wherever they're earned.

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BadgesScreen() {
  const earned = useBadgeStore((s) => s.earned);
  const headingType = useType('heading');
  const titleType = useType('title');
  const bodyType = useType('body');
  const labelType = useType('label');
  const captionType = useType('caption');

  const [selected, setSelected] = useState<BadgeId | null>(null);

  const earnedMap = useMemo(
    () => new Map(earned.map((b) => [b.id, b.earnedAt])),
    [earned],
  );
  const earnedCount = earnedMap.size;

  const selectedBadge = selected ? BADGES.find((b) => b.id === selected) : undefined;
  const selectedMeta = selected ? badgeMeta[selected] : undefined;
  const selectedEarnedAt = selected ? earnedMap.get(selected) : undefined;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[captionType, styles.count]}>
            {earnedCount} of {BADGES.length} earned
          </Text>

          <View style={styles.grid}>
            {BADGES.map((badge, i) => {
              const meta = badgeMeta[badge.id];
              return (
                <View key={badge.id} style={styles.cell}>
                  <BadgeTile
                    title={badge.title}
                    Icon={meta.Icon}
                    accent={meta.accent}
                    earned={earnedMap.has(badge.id)}
                    seed={i + 1}
                    onPress={() => setSelected(badge.id)}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Detail sheet */}
        <Modal
          visible={selected !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelected(null)}
        >
          <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
            {selectedBadge && selectedMeta ? (
              <Pressable style={[styles.sheet, outline.shadow]} onPress={() => undefined}>
                <View style={styles.sheetSticker}>
                  <BadgeTile
                    title={selectedBadge.title}
                    Icon={selectedMeta.Icon}
                    accent={selectedMeta.accent}
                    earned={earnedMap.has(selectedBadge.id)}
                    seed={3}
                    size={104}
                  />
                </View>

                <Text style={[bodyType, styles.sheetDescription]}>
                  {selectedMeta.description}
                </Text>

                <View style={styles.sheetField}>
                  <Text style={[labelType, styles.sheetFieldLabel]}>How to earn it</Text>
                  <Text style={[bodyType, styles.sheetFieldValue]}>{selectedBadge.howToEarn}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: selectedEarnedAt ? color.success : color.paperDeep,
                      borderColor: outline.color,
                    },
                  ]}
                >
                  <Text
                    style={[
                      captionType,
                      styles.statusText,
                      { color: selectedEarnedAt ? '#FFFFFF' : color.inkSoft },
                    ]}
                  >
                    {selectedEarnedAt
                      ? `Earned on ${formatDate(selectedEarnedAt)}`
                      : 'Locked — keep going!'}
                  </Text>
                </View>

                <Button label="Close" onPress={() => setSelected(null)} style={styles.closeButton} />
              </Pressable>
            ) : null}
          </Pressable>
        </Modal>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  count: { color: color.inkSoft },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xl,
  },
  cell: {
    width: '33.33%',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(35, 50, 61, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: color.cream,
    borderRadius: radius.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  sheetSticker: {
    marginBottom: spacing.xs,
  },
  sheetDescription: {
    color: color.ink,
    textAlign: 'center',
  },
  sheetField: {
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  sheetFieldLabel: {
    color: color.inkSoft,
  },
  sheetFieldValue: {
    color: color.ink,
  },
  statusPill: {
    borderRadius: radius.chip,
    borderWidth: outline.width,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontFamily: 'Nunito_700Bold',
  },
  closeButton: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
});
