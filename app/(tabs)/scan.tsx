import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useRouter } from 'expo-router';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScanStore } from '@/src/data/stores/scanStore';
import { Button, Card, PaperBackground, ScreenHeader } from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, outline, spacing, tapTarget } from '@/src/ui/theme/tokens';
import { fontFamily } from '@/src/ui/theme/typography';
import { prepareGarmentImage } from '@/src/utils/prepareGarmentImage';

// Scan screen (Section 7.3) — the entry point of the vertical slice. Capture
// or pick a photo, resize + copy it into the document directory, run the mock
// grader, then push Result. Camera-permission-denied falls back to the library
// so the screen is always useful (Section 7.3).

type Phase = 'camera' | 'analyzing';

const ANALYZING_TIMEOUT_MS = 10000; // Section 7.4: 10s → friendly retry.

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('camera');
  const [failed, setFailed] = useState(false);
  const analyze = useScanStore((s) => s.analyze);
  // Hooks must run unconditionally — hoist text styles above the early returns.
  const bodyType = useType('body');
  const labelType = useType('label');

  // Run the shared pipeline: persist the image, grade it, then go to Result.
  const process = useCallback(
    async (sourceUri: string) => {
      setFailed(false);
      setPhase('analyzing');
      try {
        const localUri = await prepareGarmentImage(sourceUri);
        await analyze(localUri);
        if (useScanStore.getState().status === 'done') {
          setPhase('camera');
          // Cast: typed-routes types regenerate when the dev server runs; the
          // path is valid (app/result.tsx).
          router.push('/result' as Href);
        } else {
          setFailed(true);
        }
      } catch {
        setFailed(true);
      }
    },
    [analyze, router],
  );

  const takePhoto = useCallback(async () => {
    if (!cameraReady) return;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
      if (photo?.uri) await process(photo.uri);
    } catch {
      setFailed(true);
      setPhase('analyzing');
    }
  }, [cameraReady, process]);

  const pickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await process(result.assets[0].uri);
    }
  }, [process]);

  if (phase === 'analyzing') {
    return <Analyzing failed={failed} onRetry={() => setPhase('camera')} />;
  }

  // Permissions still loading.
  if (!permission) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator color={color.blue} />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  // Denied (or not yet asked): explain + fall back to the library (Section 7.3).
  if (!permission.granted) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen} edges={['top']}>
          <View style={styles.content}>
            <ScreenHeader
              title="Scan a garment"
              subtitle="We use the camera to look at the clothing."
            />
            <Card surface={color.blueSoft} seed={3} style={styles.permissionCard}>
              <Text style={[bodyType, styles.permissionText]}>
                The camera isn’t on yet. You can turn it on, or choose a photo from your
                library instead.
              </Text>
              {permission.canAskAgain ? (
                <Button label="Allow camera" onPress={requestPermission} pill />
              ) : (
                <Button label="Open settings" onPress={() => Linking.openSettings()} pill />
              )}
              <Button
                label="Choose from library"
                onPress={pickFromLibrary}
                variant="secondary"
                icon={<ImageIcon color={color.ink} size={20} strokeWidth={2.5} />}
              />
            </Card>
          </View>
        </SafeAreaView>
      </PaperBackground>
    );
  }

  // Granted — live camera with a framing guide and a big shutter.
  return (
    <View style={styles.cameraScreen}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />
      <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
        <View style={styles.guideWrap} pointerEvents="none">
          <View style={styles.guide} />
          <Text style={[labelType, styles.tip]}>Lay it flat in good light.</Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={pickFromLibrary}
            accessibilityRole="button"
            accessibilityLabel="Choose from library"
            style={[styles.libraryButton, outline.shadow]}
          >
            <ImageIcon color={color.ink} size={26} strokeWidth={2.5} />
          </Pressable>

          <Pressable
            onPress={takePhoto}
            disabled={!cameraReady}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            accessibilityState={{ disabled: !cameraReady }}
            style={[styles.shutter, outline.shadow, !cameraReady && styles.shutterDisabled]}
          >
            <Camera color="#FFFFFF" size={34} strokeWidth={2.5} />
          </Pressable>

          {/* Spacer to keep the shutter centered. */}
          <View style={styles.libraryButton} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// Calm analyzing loader (Section 7.4): rotating copy while the mock resolves
// (~1.2s), and a friendly retry on failure or the 10s timeout.
function Analyzing({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  const headingType = useType('heading');
  const bodyType = useType('body');
  const [line, setLine] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const lines = ['Looking at the fabric…', 'Checking for wear…', 'Finding its best next home…'];

  useEffect(() => {
    if (failed) return;
    const rotate = setInterval(() => setLine((i) => (i + 1) % lines.length), 1600);
    const watchdog = setTimeout(() => setTimedOut(true), ANALYZING_TIMEOUT_MS);
    return () => {
      clearInterval(rotate);
      clearTimeout(watchdog);
    };
    // lines is a stable literal; intentionally run once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  const showRetry = failed || timedOut;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.centered}>
        {showRetry ? (
          <View style={styles.analyzingBox}>
            <Text style={[headingType, styles.analyzingTitle]}>That took too long</Text>
            <Text style={[bodyType, styles.analyzingMessage]}>
              Let’s try that photo again.
            </Text>
            <Button label="Try again" onPress={onRetry} pill style={styles.retryButton} />
          </View>
        ) : (
          <View style={styles.analyzingBox}>
            <ActivityIndicator size="large" color={color.blue} />
            <Text style={[headingType, styles.analyzingTitle, { fontFamily: fontFamily.display }]}>
              {lines[line]}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  permissionCard: { gap: spacing.md, marginTop: spacing.lg },
  permissionText: { color: color.ink },

  cameraScreen: { flex: 1, backgroundColor: color.ink },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  guideWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  guide: {
    width: '82%',
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 28,
    borderStyle: 'dashed',
  },
  tip: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(35,50,61,0.55)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: color.blue,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { backgroundColor: color.inkSoft },
  libraryButton: {
    width: tapTarget.primary,
    height: tapTarget.primary,
    borderRadius: tapTarget.primary / 2,
    backgroundColor: color.cream,
    borderWidth: outline.width,
    borderColor: outline.color,
    alignItems: 'center',
    justifyContent: 'center',
  },

  analyzingBox: { alignItems: 'center', gap: spacing.lg },
  analyzingTitle: { color: color.ink, textAlign: 'center' },
  analyzingMessage: { color: color.inkSoft, textAlign: 'center' },
  retryButton: { alignSelf: 'stretch', marginTop: spacing.sm },
});
