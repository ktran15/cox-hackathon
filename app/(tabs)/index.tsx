import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfileStats } from '@/src/data/selectors/profileSelectors';
import { useClosetStore } from '@/src/data/stores/closetStore';
import type { Route } from '@/src/domain/types';
import {
  Button,
  EmptyState,
  GarmentCard,
  Hammie,
  ImpactStat,
  NextMilestoneGoal,
  PaperBackground,
  TornEdge,
} from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, outline, radius, routeColor, spacing, textOn } from '@/src/ui/theme/tokens';

// Home — Outgrown Closet (Section 7.2). A bold "Hand-Me-Up" hero band carries
// the mascot (Hammie) and the three live impact metrics, which count up on load
// (ImpactStat, gated by reduce-motion). Below it, one alternating Water/CO₂
// milestone goal, then filter chips and the 2-column garment grid. The empty
// state is the ONLY place the explainer copy lives.

type Filter = 'all' | Route;

const FILTERS: { key: Filter; label: string; tint: string }[] = [
  { key: 'all', label: 'All', tint: color.blue },
  { key: 'resell', label: 'Resell', tint: routeColor.resell },
  { key: 'donate', label: 'Donate', tint: routeColor.donate },
  { key: 'recycle', label: 'Recycle', tint: routeColor.recycle },
];

function FilterChip({
  label,
  count,
  tint,
  selected,
  onPress,
}: {
  label: string;
  count: number;
  tint: string;
  selected: boolean;
  onPress: () => void;
}) {
  const captionType = useType('caption');
  const fg = selected ? textOn(tint) : color.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${count} ${count === 1 ? 'item' : 'items'}`}
      style={[
        styles.chip,
        selected ? { backgroundColor: tint } : { backgroundColor: color.card },
      ]}
    >
      <Text style={[captionType, styles.chipLabel, { color: fg }]}>
        {label} {count}
      </Text>
    </Pressable>
  );
}

export default function ClosetScreen() {
  const router = useRouter();
  const garments = useClosetStore((s) => s.garments);
  const stats = useMemo(() => getProfileStats(garments), [garments]);
  const captionType = useType('caption');
  const displayType = useType('display');

  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: garments.length,
      resell: 0,
      donate: 0,
      recycle: 0,
    };
    for (const g of garments) if (g.route) c[g.route] += 1;
    return c;
  }, [garments]);

  const isClosetEmpty = garments.length === 0;
  const filtered = useMemo(
    () => (filter === 'all' ? garments : garments.filter((g) => g.route === filter)),
    [garments, filter],
  );

  const Header = (
    <View>
      {/* Bold "Hand-Me-Up" hero band (5.8) with Hammie, the constant mascot,
          beside the title and the three impact metrics counting up. */}
      <View style={styles.heroBand}>
        <View style={styles.heroTop}>
          <Text style={[displayType, styles.heroTitle]}>Hand-Me-Up</Text>
          <Hammie size={68} onesieColor="sunshine" accessibilityLabel="Hammie, your Hand-Me-Up buddy" />
        </View>
        <View style={styles.heroStats}>
          <ImpactStat value={stats.totalWaterL} unit="L" label="Water saved" size="compact" tone="light" />
          <View style={styles.statDivider} />
          <ImpactStat
            value={stats.totalCo2Kg}
            unit="kg"
            label="CO₂ saved"
            size="compact"
            decimals={1}
            tone="light"
          />
          <View style={styles.statDivider} />
          <ImpactStat value={stats.totalGarments} label="Items" size="compact" tone="light" />
        </View>
      </View>
      <TornEdge color={color.blue} side="bottom" seed={5} style={styles.heroTear} />

      <View style={styles.headerBody}>
        <NextMilestoneGoal water={stats.water} co2={stats.co2} />

        <Button label="Add a garment" onPress={() => router.push('/scan')} pill style={styles.cta} />

        {!isClosetEmpty ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                count={counts[f.key]}
                tint={f.tint}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <FlatList
          data={isClosetEmpty ? [] : filtered}
          keyExtractor={(g) => g.id}
          numColumns={2}
          ListHeaderComponent={Header}
          renderItem={({ item, index }) => (
            <View style={styles.cell}>
              <GarmentCard
                garment={item}
                seed={index + 1}
                onPress={() => router.push(`/garment/${item.id}` as Href)}
              />
            </View>
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            isClosetEmpty ? (
              // The ONLY place the explainer copy lives (Section 7.2).
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon={<Hammie size={64} />}
                  title="Your closet is empty"
                  message="Scan your first outgrown outfit to get started."
                  actionLabel="Add a garment"
                  onAction={() => router.push('/scan')}
                />
              </View>
            ) : (
              <View style={styles.filterEmpty}>
                <Text style={[captionType, styles.filterEmptyText]}>
                  No {filter} items yet.
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  heroBand: {
    backgroundColor: color.blue,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: '#FFFFFF',
    flexShrink: 1,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  statDivider: {
    width: outline.width,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  heroTear: {
    // Overlap the band by a hairline so no cream seam shows through.
    marginTop: -1,
  },
  headerBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  cta: {},
  chipRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    borderRadius: radius.chip,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
    ...outline.shadow,
  },
  chipLabel: {
    fontFamily: 'Nunito_700Bold',
  },
  row: { gap: spacing.md, paddingHorizontal: spacing.lg },
  cell: { flex: 1 },
  emptyWrap: { paddingHorizontal: spacing.lg },
  filterEmpty: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, alignItems: 'center' },
  filterEmptyText: { color: color.inkSoft },
});
