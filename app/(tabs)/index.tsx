import { useRouter } from 'expo-router';
import { Shirt } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfileStats } from '@/src/data/selectors/profileSelectors';
import { useClosetStore } from '@/src/data/stores/closetStore';
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
import { color, outline, spacing } from '@/src/ui/theme/tokens';

// Home — Outgrown Closet (Section 7.2). A bold "Hand-Me-Up" hero band carries
// the mascot (Hammie) and the three live impact metrics, which count up on load
// (ImpactStat, gated by reduce-motion). Below it, one alternating Water/CO₂
// milestone goal keeps the next target in view.

export default function ClosetScreen() {
  const router = useRouter();
  const garments = useClosetStore((s) => s.garments);
  const removeGarment = useClosetStore((s) => s.removeGarment);
  const stats = useMemo(() => getProfileStats(garments), [garments]);
  const captionType = useType('caption');
  const displayType = useType('display');

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

        {garments.length > 0 ? (
          <Text style={[captionType, styles.count]}>
            {garments.length} {garments.length === 1 ? 'garment' : 'garments'}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <FlatList
          data={garments}
          keyExtractor={(g) => g.id}
          numColumns={2}
          ListHeaderComponent={Header}
          renderItem={({ item, index }) => (
            <View style={styles.cell}>
              <GarmentCard
                garment={item}
                seed={index + 1}
                onRemove={() => removeGarment(item.id)}
              />
            </View>
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={<Shirt color={color.ink} size={40} strokeWidth={2.5} />}
                title="Your closet is empty"
                message="Your outgrown closet lives here. Scan your first outgrown outfit to get started."
                actionLabel="Add a garment"
                onAction={() => router.push('/scan')}
              />
            </View>
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
  count: { color: color.inkSoft },
  row: { gap: spacing.md, paddingHorizontal: spacing.lg },
  cell: { flex: 1 },
  emptyWrap: { paddingHorizontal: spacing.lg },
});
