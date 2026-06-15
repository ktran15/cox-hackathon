import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CO2_MILESTONES, WATER_MILESTONES } from '@/src/domain/constants';
import { getProfileStats } from '@/src/data/selectors/profileSelectors';
import { useClosetStore } from '@/src/data/stores/closetStore';
import {
  Button,
  Card,
  Hammie,
  LevelPlant,
  NextMilestoneGoal,
  PaperBackground,
  ScreenHeader,
} from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, spacing } from '@/src/ui/theme/tokens';

// Profile (Section 7.8). Hammie is the constant mascot/avatar — he doesn't
// change with progress. The LevelPlant is the thing that GROWS: its stage is
// driven by the combined milestone count across both ladders (Section 8.3), and
// it springs a step taller each time a new milestone is reached. Totals are
// derived from the closet via profileSelectors (state-integrity rule).

const TOTAL_MILESTONES = WATER_MILESTONES.length + CO2_MILESTONES.length;

export default function ProfileScreen() {
  const router = useRouter();
  const garments = useClosetStore((s) => s.garments);
  const stats = useMemo(() => getProfileStats(garments), [garments]);
  const titleType = useType('title');
  const captionType = useType('caption');

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.content}>
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

          {/* Hammie — the constant avatar for every user. */}
          <View style={styles.avatarRow}>
            <Hammie size={84} accessibilityLabel="Hammie, your Hand-Me-Up buddy" />
            <Text style={[titleType, styles.hello]}>Hi from Hammie!</Text>
          </View>

          {/* The plant grows with combined milestones reached across both ladders. */}
          <Card seed={3} style={styles.plantCard}>
            <LevelPlant level={stats.plantStage} size={140} />
            <Text style={[captionType, styles.plantCaption]}>
              {stats.milestonesReached} of {TOTAL_MILESTONES} milestones reached
            </Text>
          </Card>

          <NextMilestoneGoal water={stats.water} co2={stats.co2} style={styles.goal} />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hello: {
    color: color.ink,
    flexShrink: 1,
  },
  plantCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  plantCaption: {
    color: color.inkSoft,
  },
  goal: {
    marginTop: spacing.xs,
  },
});
