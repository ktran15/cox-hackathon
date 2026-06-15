import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BADGES } from '@/src/domain/constants';
import { routeCopy } from '@/src/domain/grading-rules';
import type { Route, Saving } from '@/src/domain/types';
import { getBadgeStats } from '@/src/data/selectors/profileSelectors';
import { useBadgeStore } from '@/src/data/stores/badgeStore';
import { useClosetStore } from '@/src/data/stores/closetStore';
import { useScanStore } from '@/src/data/stores/scanStore';
import { Button, Card, Celebration, EmptyState, PaperBackground } from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, outline, radius, routeColor, spacing, textOn } from '@/src/ui/theme/tokens';
import { fontFamily } from '@/src/ui/theme/typography';

// Route action (Section 7.6) — Milestone-4 slice. Completing a route creates
// the garment, computes the saving via the data layer, runs badge evaluation,
// then celebrates and returns to the closet. The full Resell/Donate/Recycle
// modes (listings, MapList) arrive in Milestone 7 — this is minimal but real.

function isRoute(value: string | undefined): value is Route {
  return value === 'resell' || value === 'donate' || value === 'recycle';
}

const badgeTitle = (id: string): string =>
  BADGES.find((b) => b.id === id)?.title ?? id;

export default function RouteActionScreen() {
  const router = useRouter();
  const { type: typeParam } = useLocalSearchParams<{ type: string }>();
  const result = useScanStore((s) => s.result);
  const resetScan = useScanStore((s) => s.reset);
  const addGarment = useClosetStore((s) => s.addGarment);
  const routeGarment = useClosetStore((s) => s.routeGarment);

  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState<Saving | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const titleType = useType('title');
  const headingType = useType('heading');
  const bodyType = useType('body');
  const labelType = useType('label');

  // Unknown route param → friendly error with a way back (Section 6).
  if (!isRoute(typeParam)) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen}>
          <EmptyState
            title="That option isn’t available"
            message="Let’s head back and pick where this garment should go."
            actionLabel="Back to result"
            onAction={() => router.back()}
          />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  const route = typeParam;
  const copy = routeCopy[route];
  const tint = routeColor[route];

  // No scan to route (opened directly / already consumed).
  if (!result && !done) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen}>
          <EmptyState
            title="Nothing to route yet"
            message="Scan a garment first, then choose where it should go."
            actionLabel="Go to scan"
            onAction={() => router.dismissTo('/scan')}
          />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  const confirm = () => {
    if (!result) return;
    const garment = addGarment({
      imageUri: result.imageUri,
      type: result.type,
      grade: result.grade,
      defects: result.defects,
    });
    routeGarment(garment.id, route);

    // Evaluate badges off the freshly updated closet (sync set). The
    // donatedHighReuse flag is wired in Milestone 7 when places are pickable.
    const stats = getBadgeStats(useClosetStore.getState().garments);
    const earned = useBadgeStore.getState().awardFromStats(stats);

    setSaving(useClosetStore.getState().getById(garment.id)?.saving ?? null);
    setNewBadges(earned);
    setDone(true);
    resetScan();
  };

  const backToCloset = () => router.dismissTo('/');

  if (done) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen} edges={['bottom']}>
          <View style={styles.successContent}>
            <View style={[styles.successBadge, outline.shadow, { backgroundColor: tint }]}>
              <Text
                style={[titleType, { color: textOn(tint), fontFamily: fontFamily.displayHeavy }]}
              >
                {copy.doneLabel}
              </Text>
            </View>

            {saving ? (
              <Card surface={color.cream} seed={2} style={styles.savingCard}>
                <Text style={[labelType, styles.savingLabel]}>You just saved</Text>
                <Text style={[headingType, styles.savingValue]}>
                  +{saving.waterL.toLocaleString()} L water
                </Text>
                <Text style={[headingType, styles.savingValue]}>+{saving.co2Kg} kg CO₂</Text>
              </Card>
            ) : null}

            {newBadges.length > 0 ? (
              <Card surface={color.sunshine} seed={7} style={styles.badgeCard}>
                <Text style={[labelType, { color: color.ink }]}>New badge unlocked</Text>
                {newBadges.map((id) => (
                  <Text key={id} style={[headingType, styles.badgeName]}>
                    {badgeTitle(id)}
                  </Text>
                ))}
              </Card>
            ) : null}

            <Button label="Back to closet" onPress={backToCloset} pill style={styles.successButton} />
          </View>
          <Celebration active={done} />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.headerBand, { backgroundColor: tint }]}>
            <Text style={[titleType, { color: textOn(tint), fontFamily: fontFamily.display }]}>
              {copy.label}
            </Text>
          </View>

          <Text style={[bodyType, styles.oneLiner]}>{copy.oneLiner}</Text>

          <Card surface={color.card} seed={4} style={styles.infoCard}>
            <Text style={[bodyType, styles.infoText]}>
              We’ll add this garment to your closet and count its impact. The full{' '}
              {copy.label.toLowerCase()} steps arrive soon.
            </Text>
          </Card>

          <Button label={copy.actionLabel} onPress={confirm} pill style={styles.confirmButton} />
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  headerBand: {
    borderRadius: radius.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...outline.shadow,
  },
  oneLiner: { color: color.ink, textAlign: 'center' },
  infoCard: {},
  infoText: { color: color.ink },
  confirmButton: { marginTop: spacing.sm },

  successContent: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  successBadge: {
    borderRadius: radius.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    transform: [{ rotate: '-1.5deg' }],
  },
  savingCard: { gap: spacing.xs, alignItems: 'center' },
  savingLabel: { color: color.inkSoft },
  savingValue: { color: color.ink },
  badgeCard: { gap: spacing.xs, alignItems: 'center' },
  badgeName: { color: color.ink },
  successButton: { alignSelf: 'stretch', marginTop: spacing.md },
});
