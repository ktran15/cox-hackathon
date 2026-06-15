import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { computeSaving } from '@/src/domain/impact';
import {
  gradeStatus,
  recommendationReason,
  recommendedRoute,
  routeCopy,
} from '@/src/domain/grading-rules';
import type { Route } from '@/src/domain/types';
import { useClosetStore } from '@/src/data/stores/closetStore';
import { useScanStore } from '@/src/data/stores/scanStore';
import { Button, Card, EmptyState, PaperBackground, GradeBadge } from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, outline, radius, routeColor, spacing, textOn } from '@/src/ui/theme/tokens';

// Result screen (Section 7.5) — shows the grade sticker, plain-language status,
// any flaws, and the recommended route with its saving preview. The parent can
// take the recommendation, override it, or just save for now. All copy comes
// from the domain grading-rules module (no strings hardcoded twice).

const ALL_ROUTES: Route[] = ['resell', 'donate', 'recycle'];

export default function ResultScreen() {
  const router = useRouter();
  const result = useScanStore((s) => s.result);
  const reset = useScanStore((s) => s.reset);
  const addGarment = useClosetStore((s) => s.addGarment);
  const [showOptions, setShowOptions] = useState(false);

  const headingType = useType('heading');
  const bodyType = useType('body');
  const captionType = useType('caption');
  const labelType = useType('label');

  // No scan in flight (e.g. opened directly) — friendly way back.
  if (!result) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen}>
          <EmptyState
            title="Nothing to show yet"
            message="Scan an outgrown garment and its result will appear here."
            actionLabel="Go to scan"
            onAction={() => router.replace('/scan')}
          />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  const { grade, type, defects, imageUri } = result;
  const recommended = recommendedRoute(grade);
  const preview = computeSaving(type, recommended, grade);
  const recColor = routeColor[recommended];

  // Cast: typed-routes types regenerate when the dev server runs; the path is
  // valid (app/route/[type].tsx).
  const goToRoute = (route: Route) => router.push(`/route/${route}` as Href);

  const saveForNow = () => {
    addGarment({ imageUri, type, grade, defects });
    reset();
    router.dismissTo('/');
  };

  const otherRoutes = ALL_ROUTES.filter((r) => r !== recommended);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />

          <View style={styles.gradeRow}>
            <GradeBadge grade={grade} label={gradeStatus[grade]} size="large" />
          </View>

          {defects.length > 0 ? (
            <View style={styles.flawRow}>
              {defects.map((d) => (
                <View key={d.label} style={styles.flawChip}>
                  <Text style={[captionType, styles.flawText]}>{d.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Recommendation card takes on the route color (Section 5.8). */}
          <Card surface={recColor} seed={5} style={styles.recCard}>
            <Text style={[captionType, { color: textOn(recColor) }]}>We suggest</Text>
            <Text style={[headingType, styles.recTitle, { color: textOn(recColor) }]}>
              {routeCopy[recommended].label}
            </Text>
            <Text style={[bodyType, { color: textOn(recColor) }]}>
              {recommendationReason[grade]}
            </Text>
            <View style={styles.savingPill}>
              <Text style={[labelType, styles.savingText]}>
                This could save about {preview.waterL.toLocaleString()} L of water and{' '}
                {preview.co2Kg} kg of CO₂.
              </Text>
            </View>
          </Card>

          <View style={styles.actions}>
            <Button
              label={routeCopy[recommended].actionLabel}
              onPress={() => goToRoute(recommended)}
              pill
            />

            {showOptions ? (
              <>
                <Text style={[labelType, styles.otherLabel]}>Or choose a different option</Text>
                {otherRoutes.map((r) => (
                  <Button
                    key={r}
                    label={routeCopy[r].actionLabel}
                    onPress={() => goToRoute(r)}
                    variant="secondary"
                  />
                ))}
              </>
            ) : (
              <Button
                label="Choose a different option"
                onPress={() => setShowOptions(true)}
                variant="secondary"
              />
            )}

            <Button label="Just save for now" onPress={saveForNow} variant="ghost" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    backgroundColor: color.blueSoft,
  },
  gradeRow: { alignItems: 'flex-start' },
  flawRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flawChip: {
    backgroundColor: color.squash,
    borderRadius: 999,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  flawText: { color: color.ink, fontFamily: 'Nunito_700Bold' },
  recCard: { gap: spacing.sm },
  recTitle: { marginBottom: spacing.xs },
  savingPill: {
    backgroundColor: color.cream,
    borderRadius: radius.button,
    borderWidth: outline.width,
    borderColor: outline.color,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  savingText: { color: color.ink },
  actions: { gap: spacing.md },
  otherLabel: { color: color.inkSoft, marginTop: spacing.xs },
});
