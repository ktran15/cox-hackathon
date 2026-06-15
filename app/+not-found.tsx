import { Stack, useRouter } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { EmptyState, PaperBackground } from '@/src/ui/components';
import { color } from '@/src/ui/theme/tokens';

// SPEC-NOTE: not in the Section 4 tree, but kept as the router's friendly
// fallback for unknown routes (every screen needs an error state, Section 12).

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page not found' }} />
      <PaperBackground>
        <View style={styles.container}>
          <EmptyState
            icon={<CircleHelp color={color.ink} size={40} strokeWidth={2.5} />}
            title="We can't find that page"
            message="It may have moved. Let's head back to your closet."
            actionLabel="Go to closet"
            onAction={() => router.replace('/')}
          />
        </View>
      </PaperBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
