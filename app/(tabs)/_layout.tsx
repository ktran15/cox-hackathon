import { Tabs } from 'expo-router';
import { Camera, Shirt, Sprout } from 'lucide-react-native';

import { color, outline } from '@/src/ui/theme/tokens';
import { fontFamily } from '@/src/ui/theme/typography';

// SPEC-NOTE: Section 6 asks for the Scan tab styled as a raised circular blue
// button. That visual treatment lands with the real Scan screen (Milestone 4);
// until then all three tabs are normal styled tabs, the fallback the spec allows.

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.blue,
        tabBarInactiveTintColor: color.inkSoft,
        // Crayon outline on the tab bar (Section 5.5) — paper surface with a
        // thick ink top edge, like a strip of paper glued along the bottom.
        tabBarStyle: {
          backgroundColor: color.cream,
          borderTopWidth: outline.width,
          borderTopColor: outline.color,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.bodyBold,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Closet',
          tabBarIcon: ({ color: tint, size }) => (
            <Shirt color={tint} size={size} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color: tint, size }) => (
            <Camera color={tint} size={size} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color: tint, size }) => (
            <Sprout color={tint} size={size} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}
