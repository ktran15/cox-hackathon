import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, EmptyState, PaperBackground } from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, spacing } from '@/src/ui/theme/tokens';

// SPEC-NOTE: Settings is built in full in Milestone 8 (text-size control,
// reduce-motion toggle, name, About, Sources, privacy line). This is a minimal
// placeholder so the Profile's "Settings" link (Section 7.8) is a working
// destination now rather than a dead route. The privacy line is shown already.

export default function SettingsScreen() {
  const router = useRouter();
  const bodyType = useType('body');

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <EmptyState
            title="Settings are on the way"
            message="Text size, reduce motion, your name, and sources arrive in the next update."
            actionLabel="Back to profile"
            onAction={() => router.back()}
          />
          <Card surface={color.cream} seed={4}>
            <Text style={[bodyType, styles.privacy]}>
              Your photos and data stay on your device.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  privacy: { color: color.ink, textAlign: 'center' },
});
