/**
 * Create Listing Stack Layout
 * Defines routes for the create listing flow:
 * - collection: Select child category from a collection
 * - brand: Select brand
 * - model: Select model
 * - variant: Select variant
 * - wizard: Main form wizard
 * - success: Success screen after listing creation
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme';

export default function CreateLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.bg,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Rubik-SemiBold',
        },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="collection" options={{ title: 'اختر الفئة' }} />
      <Stack.Screen name="brand" options={{ title: 'اختر الماركة' }} />
      <Stack.Screen name="model" options={{ title: 'اختر الموديل' }} />
      <Stack.Screen name="variant" options={{ title: 'اختر الطراز' }} />
      <Stack.Screen name="wizard" options={{ title: 'إضافة إعلان' }} />
      <Stack.Screen name="success" options={{ headerShown: false }} />
    </Stack>
  );
}
