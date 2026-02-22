/**
 * Create Listing Stack Layout
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
          fontFamily: 'Cairo-Bold',
        },
        headerBackTitle: 'رجوع',
        contentStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    />
  );
}
