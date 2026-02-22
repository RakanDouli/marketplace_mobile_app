/**
 * Search Tab Layout
 * Stack navigation for search flow: Categories → Type Selection → Listings → Filters
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../../src/theme';

export default function SearchLayout() {
  const theme = useTheme();

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
          fontSize: theme.fontSize.lg,
        },
        headerBackTitle: 'رجوع',
        headerBackTitleStyle: {
          fontFamily: theme.fontFamily.body,
        },
        contentStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'البحث',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[categorySlug]/filters"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'الفلاتر',
        }}
      />
    </Stack>
  );
}
