/**
 * Analytics Stack Layout
 * Nested stack navigator for analytics screens
 */

import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '../../../../src/theme';

export default function AnalyticsStackLayout() {
  const theme = useTheme();

  // Use fade animation on Android to avoid RTL animation issues
  const animation = Platform.OS === 'android' ? 'fade' : 'slide_from_right';

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.bg,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: theme.fontFamily.header,
        },
        headerTitleAlign: 'center',
        headerBackButtonDisplayMode: 'minimal',
        animation: animation,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'الإحصائيات',
        }}
      />
      <Stack.Screen
        name="[listingId]"
        options={{
          title: 'تفاصيل الإعلان',
        }}
      />
    </Stack>
  );
}
