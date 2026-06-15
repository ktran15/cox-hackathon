import { Grandstander_600SemiBold } from '@expo-google-fonts/grandstander/600SemiBold';
import { Grandstander_700Bold } from '@expo-google-fonts/grandstander/700Bold';
import { Grandstander_800ExtraBold } from '@expo-google-fonts/grandstander/800ExtraBold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { TextSizeProvider } from '@/src/ui/theme/TextSizeProvider';
import { fontFamily } from '@/src/ui/theme/typography';
import { color } from '@/src/ui/theme/tokens';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Keep the splash screen visible until the fonts are ready.
SplashScreen.preventAutoHideAsync();

// Cut-Paper Classroom: warm cream paper everywhere, ink text, blue anchor.
const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: color.blue,
    background: color.paper,
    card: color.paper,
    text: color.ink,
    border: color.ink,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Grandstander_600SemiBold,
    Grandstander_700Bold,
    Grandstander_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <TextSizeProvider>
      <ThemeProvider value={appTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: color.paper },
            headerTintColor: color.ink,
            headerTitleStyle: { fontFamily: fontFamily.display, color: color.ink },
            headerStyle: { backgroundColor: color.paper },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="result" options={{ title: 'Your garment' }} />
          <Stack.Screen name="route/[type]" options={{ title: 'Almost there' }} />
          <Stack.Screen name="dev-components" options={{ title: 'Design system' }} />
        </Stack>
      </ThemeProvider>
    </TextSizeProvider>
  );
}
