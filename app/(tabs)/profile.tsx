import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfileStats } from '@/src/data/selectors/profileSelectors';
import { useBadgeStore } from '@/src/data/stores/badgeStore';
import { useClosetStore } from '@/src/data/stores/closetStore';
import { useSettingsStore } from '@/src/data/stores/settingsStore';
import { CO2_MILESTONES, WATER_MILESTONES, BADGES } from '@/src/domain/constants';
import type { Route } from '@/src/domain/types';
import { badgeMeta } from '@/src/ui/badges/badgeMeta';
import {
  BadgeTile,
  Button,
  Card,
  Hammie,
  ImpactStat,
  LevelPlant,
  MilestoneProgressBar,
  PaperBackground,
  RouteChip,
  ScreenHeader,
} from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, outline, spacing } from '@/src/ui/theme/tokens';

// Profile (Section 7.8). Hammie is the constant avatar (he never changes with
// progress). The LevelPlant is what GROWS — its stage is the combined milestone
// count across both ladders (Section 8.3), and LevelPlant springs a step taller
// whenever that stage increases (gated by reduce-motion). Every number is
// derived from the closet via profileSelectors; nothing is stored.

const TOTAL_MILESTONES = WATER_MILESTONES.length + CO2_MILESTONES.length;
const ROUTES: Route[] = ['resell', 'donate', 'recycle'];
const PREVIEW_COUNT = 6;

function SectionHeading({
  title,
  accent,
  action,
}: {
  title: string;
  accent: string;
  action?: React.ReactNode;
}) {
  const headingType = useType('heading');
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleWrap}>
        <Text style={[headingType, styles.sectionTitle]}>{title}</Text>
        <View style={[styles.sectionUnderline, { backgroundColor: accent }]} />
      </View>
      {action}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const garments = useClosetStore((s) => s.garments);
  const stats = useMemo(() => getProfileStats(garments), [garments]);

  const name = useSettingsStore((s) => s.name);
  const setName = useSettingsStore((s) => s.setName);
  const earned = useBadgeStore((s) => s.earned);
  const earnedSet = useMemo(() => new Set(earned.map((b) => b.id)), [earned]);

  const [nameDraft, setNameDraft] = useState(name ?? '');

  const titleType = useType('title');
  const headingType = useType('heading');
  const captionType = useType('caption');
  const labelType = useType('label');

  // Badge preview: earned first, then locked, capped (Section 7.8).
  const preview = useMemo(() => {
    return [...BADGES]
      .sort(
        (a, b) => Number(earnedSet.has(b.id)) - Number(earnedSet.has(a.id)),
      )
      .slice(0, PREVIEW_COUNT);
  }, [earnedSet]);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    setName(trimmed.length > 0 ? trimmed : undefined);
  };

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenHeader
            title="Profile"
            subtitle="Watch your impact grow."
            right={
              // DEV ONLY: temporary entry point to the component gallery. Remove before final build.
              <Button
                label="Dev"
                variant="secondary"
                onPress={() => router.push('/dev-components')}
                accessibilityLabel="Open dev components (temporary)"
              />
            }
          />

          {/* Hammie — the constant avatar — with an optional editable name. */}
          <View style={styles.avatarRow}>
            <Hammie size={84} accessibilityLabel="Hammie, your Hand-Me-Up buddy" />
            <View style={styles.nameWrap}>
              <Text style={[captionType, styles.nameLabel]}>Your name (optional)</Text>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                onBlur={commitName}
                onEndEditing={commitName}
                placeholder="Add your name"
                placeholderTextColor={color.inkSoft}
                accessibilityLabel="Your name"
                returnKeyType="done"
                style={[titleType, styles.nameInput]}
              />
            </View>
          </View>

          {/* The growing plant — its stage is the combined milestone count. */}
          <Card seed={3} style={styles.plantCard}>
            <LevelPlant level={stats.plantStage} size={150} />
            <Text style={[labelType, styles.plantStage]}>
              Growth stage {stats.plantStage} of 6
            </Text>
            <Text style={[captionType, styles.plantCaption]}>
              {stats.milestonesReached} of {TOTAL_MILESTONES} milestones reached
            </Text>
          </Card>

          {/* Both milestone ladders, each legible about its goal. */}
          <SectionHeading title="Your milestones" accent={color.seafoam} />
          <Card surface={color.cream} seed={5} style={styles.milestoneCard}>
            <MilestoneProgressBar
              progress={stats.water}
              metricLabel="Water"
              unit="L"
              decimals={0}
              accent={color.blue}
            />
            <View style={styles.milestoneDivider} />
            <MilestoneProgressBar
              progress={stats.co2}
              metricLabel="CO₂"
              unit="kg"
              decimals={1}
              accent={color.seafoam}
            />
          </Card>

          {/* Lifetime impact — hero stat cards, count-up on load. */}
          <SectionHeading title="Lifetime impact" accent={color.blue} />
          <View style={styles.impactGrid}>
            <Card surface={color.blueSoft} seed={1} style={styles.impactCell}>
              <ImpactStat value={stats.totalWaterL} unit="L" label="Water saved" />
            </Card>
            <Card surface={color.pea} seed={2} style={styles.impactCell}>
              <ImpactStat value={stats.totalCo2Kg} unit="kg" label="CO₂ saved" decimals={1} />
            </Card>
            <Card surface={color.squash} seed={3} style={styles.impactCell}>
              <ImpactStat
                value={stats.totalDivertedKg}
                unit="kg"
                label="Landfill diverted"
                decimals={2}
              />
            </Card>
            <Card surface={color.sunshine} seed={4} style={styles.impactCell}>
              <ImpactStat value={stats.totalGarments} label="Items routed" />
            </Card>
          </View>

          {/* Route breakdown. */}
          <SectionHeading title="Where they went" accent={color.bubblegum} />
          <Card seed={6} style={styles.routeCard}>
            {ROUTES.map((r) => (
              <View key={r} style={styles.routeCol}>
                <Text style={[titleType, styles.routeCount]}>{stats.byRoute[r]}</Text>
                <RouteChip route={r} />
              </View>
            ))}
          </Card>

          {/* Badge preview + See all. */}
          <SectionHeading
            title="Badges"
            accent={color.sunshine}
            action={
              <Pressable
                onPress={() => router.push('/badges')}
                accessibilityRole="button"
                accessibilityLabel="See all badges"
                hitSlop={8}
              >
                <Text style={[labelType, styles.seeAll]}>See all</Text>
              </Pressable>
            }
          />
          <View style={styles.badgeGrid}>
            {preview.map((badge, i) => {
              const meta = badgeMeta[badge.id];
              return (
                <View key={badge.id} style={styles.badgeCell}>
                  <BadgeTile
                    title={badge.title}
                    Icon={meta.Icon}
                    accent={meta.accent}
                    earned={earnedSet.has(badge.id)}
                    seed={i + 1}
                    size={64}
                    onPress={() => router.push('/badges')}
                  />
                </View>
              );
            })}
          </View>

          <Button
            label="Settings"
            variant="secondary"
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          />
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nameWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  nameLabel: {
    color: color.inkSoft,
  },
  nameInput: {
    color: color.ink,
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  plantCard: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  plantStage: {
    color: color.ink,
    marginTop: spacing.sm,
  },
  plantCaption: {
    color: color.inkSoft,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitleWrap: {},
  sectionTitle: {
    color: color.ink,
  },
  sectionUnderline: {
    width: 56,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    transform: [{ rotate: '-0.8deg' }],
  },
  seeAll: {
    color: color.blue,
  },
  milestoneCard: {
    gap: spacing.md,
  },
  milestoneDivider: {
    height: outline.width,
    backgroundColor: color.paperDeep,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  impactCell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  routeCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  routeCol: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeCount: {
    color: color.ink,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  badgeCell: {
    width: '33.33%',
    alignItems: 'center',
  },
  settingsButton: {
    marginTop: spacing.sm,
  },
});
