import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBadgeStats } from '@/src/data/selectors/profileSelectors';
import { useBadgeStore } from '@/src/data/stores/badgeStore';
import { useClosetStore } from '@/src/data/stores/closetStore';
import { gradeStatus, routeCopy } from '@/src/domain/grading-rules';
import type { PassportEvent, Route } from '@/src/domain/types';
import {
  Button,
  Card,
  EmptyState,
  GradeBadge,
  ImpactStat,
  PaperBackground,
  RouteChip,
} from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, outline, radius, routeColor, spacing, textOn } from '@/src/ui/theme/tokens';

// Garment detail + passport (Section 7.7). Shows the garment, an optional
// editable nickname, its grade/route, this garment's individual saving, and a
// simple history timeline. Unrouted garments can be routed right here. Deleting
// removes it from the closet — and because every total is DERIVED from the
// closet (state-integrity rule), the closet header updates on its own.

const ALL_ROUTES: Route[] = ['resell', 'donate', 'recycle'];

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function GarmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const garment = useClosetStore((s) => s.garments.find((g) => g.id === id));
  const updateGarment = useClosetStore((s) => s.updateGarment);
  const routeGarment = useClosetStore((s) => s.routeGarment);
  const removeGarment = useClosetStore((s) => s.removeGarment);

  const [nickname, setNickname] = useState(garment?.nickname ?? '');

  const titleType = useType('title');
  const headingType = useType('heading');
  const bodyType = useType('body');
  const labelType = useType('label');
  const captionType = useType('caption');

  // Re-sync the field if we land on a different garment (id changes).
  useEffect(() => {
    setNickname(garment?.nickname ?? '');
  }, [garment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Garment missing (bad id / already deleted) — friendly way back.
  if (!garment) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen}>
          <EmptyState
            title="Garment not found"
            message="It may have been removed. Let’s head back to your closet."
            actionLabel="Back to closet"
            onAction={() => router.dismissTo('/')}
          />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  const routed = garment.route !== undefined && garment.saving !== undefined;
  const displayName = garment.nickname?.trim() || titleCase(garment.type);

  const commitNickname = () => {
    const trimmed = nickname.trim();
    updateGarment(garment.id, { nickname: trimmed.length > 0 ? trimmed : undefined });
  };

  const handleRoute = (route: Route) => {
    routeGarment(garment.id, route);
    // Keep badges consistent with the freshly updated closet (same seam the
    // scan→route flow uses). donatedHighReuse is wired with places (Milestone 7).
    const stats = getBadgeStats(useClosetStore.getState().garments);
    useBadgeStore.getState().awardFromStats(stats);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Remove this garment?',
      `${displayName} will be removed from your closet, and its saved water and CO₂ will come off your totals.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeGarment(garment.id);
            router.dismissTo('/');
          },
        },
      ],
    );
  };

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Image source={{ uri: garment.imageUri }} style={styles.photo} resizeMode="cover" />

          {/* Optional editable nickname — selection-first app, but a nickname is
              an explicitly optional text field (Section 7.7). */}
          <View style={styles.nickWrap}>
            <Text style={[captionType, styles.fieldLabel]}>Nickname</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              onBlur={commitNickname}
              onEndEditing={commitNickname}
              placeholder="Add a nickname (optional)"
              placeholderTextColor={color.inkSoft}
              accessibilityLabel="Garment nickname"
              returnKeyType="done"
              style={[bodyType, styles.nickInput]}
            />
          </View>

          <Text style={[captionType, styles.type]}>Type: {titleCase(garment.type)}</Text>

          <View style={styles.gradeRow}>
            <GradeBadge grade={garment.grade} label={gradeStatus[garment.grade]} size="large" />
          </View>

          {/* Route status: chip when routed, otherwise inline route buttons. */}
          {routed && garment.route ? (
            <View style={styles.routedRow}>
              <RouteChip route={garment.route} />
            </View>
          ) : (
            <Card surface={color.cream} seed={6} style={styles.routeCard}>
              <Text style={[labelType, styles.notRouted]}>Not routed yet</Text>
              <Text style={[captionType, styles.notRoutedSub]}>
                Choose where it should go to count its impact.
              </Text>
              <View style={styles.routeButtons}>
                {ALL_ROUTES.map((r) => (
                  <Button
                    key={r}
                    label={routeCopy[r].actionLabel}
                    variant="secondary"
                    onPress={() => handleRoute(r)}
                  />
                ))}
              </View>
            </Card>
          )}

          {/* This garment's individual saving (Section 7.7 / 1). */}
          {routed && garment.saving ? (
            <Card surface={color.cream} seed={2} style={styles.savingCard}>
              <Text style={[labelType, styles.savingHeading]}>This garment saved</Text>
              <View style={styles.savingStats}>
                <ImpactStat value={garment.saving.waterL} unit="L" label="Water" size="compact" />
                <ImpactStat
                  value={garment.saving.co2Kg}
                  unit="kg"
                  label="CO₂"
                  size="compact"
                  decimals={1}
                />
                <ImpactStat
                  value={garment.saving.divertedKg}
                  unit="kg"
                  label="Diverted"
                  size="compact"
                  decimals={2}
                />
              </View>
            </Card>
          ) : (
            <Text style={[bodyType, styles.noImpact]}>
              No impact yet — route it above to start saving.
            </Text>
          )}

          {/* Simple history timeline. */}
          <View style={styles.history}>
            <Text style={[headingType, styles.historyTitle]}>History</Text>
            {garment.passport.length > 0 ? (
              garment.passport
                .slice()
                .reverse()
                .map((event: PassportEvent) => {
                  const tint = routeColor[event.route];
                  return (
                    <View key={event.id} style={styles.eventRow}>
                      <View style={[styles.eventDot, { backgroundColor: tint }]} />
                      <View style={styles.eventBody}>
                        <Text style={[labelType, styles.eventTitle]}>
                          {routeCopy[event.route].label} · grade {event.grade}
                        </Text>
                        <Text style={[captionType, styles.eventMeta]}>
                          {formatDate(event.at)} · +{event.saving.waterL.toLocaleString()} L ·{' '}
                          +{event.saving.co2Kg} kg CO₂
                        </Text>
                      </View>
                    </View>
                  );
                })
            ) : (
              <Text style={[captionType, styles.historyEmpty]}>
                No history yet. Route this garment to start its story.
              </Text>
            )}
          </View>

          {/* Delete with confirm — removal flows through to derived totals. */}
          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${displayName} from your closet`}
            style={({ pressed }) => [
              styles.deleteButton,
              { backgroundColor: pressed ? color.danger : color.cream },
            ]}
          >
            {({ pressed }) => (
              <>
                <Trash2 color={pressed ? textOn(color.danger) : color.danger} size={20} strokeWidth={2.5} />
                <Text
                  style={[labelType, { color: pressed ? textOn(color.danger) : color.danger }]}
                >
                  Remove from closet
                </Text>
              </>
            )}
          </Pressable>
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
  nickWrap: { gap: spacing.xs },
  fieldLabel: { color: color.inkSoft },
  nickInput: {
    color: color.ink,
    backgroundColor: color.card,
    borderRadius: radius.button,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  type: { color: color.inkSoft },
  gradeRow: { alignItems: 'flex-start' },
  routedRow: { alignItems: 'flex-start' },
  routeCard: { gap: spacing.sm },
  notRouted: { color: color.ink },
  notRoutedSub: { color: color.inkSoft },
  routeButtons: { gap: spacing.md, marginTop: spacing.sm },
  savingCard: { gap: spacing.md },
  savingHeading: { color: color.inkSoft },
  savingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noImpact: { color: color.inkSoft },
  history: { gap: spacing.md },
  historyTitle: { color: color.ink },
  eventRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  eventDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: outline.color,
    marginTop: 4,
  },
  eventBody: { flex: 1, gap: 2 },
  eventTitle: { color: color.ink },
  eventMeta: { color: color.inkSoft },
  historyEmpty: { color: color.inkSoft },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 56,
    borderRadius: radius.button,
    borderWidth: outline.width,
    borderColor: color.danger,
    marginTop: spacing.sm,
  },
});
