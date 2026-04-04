/**
 * Analytics Stack Layout
 * Nested stack navigator for analytics screens
 */

import { TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../../src/theme';

export default function AnalyticsStackLayout() {
  const theme = useTheme();
  const router = useRouter();

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
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/menu')} style={{ padding: 8 }}>
              {Platform.OS === 'ios' ? (
                <ChevronLeft size={28} color={theme.colors.text} />
              ) : (
                <ArrowLeft size={24} color={theme.colors.text} />
              )}
            </TouchableOpacity>
          ),
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
