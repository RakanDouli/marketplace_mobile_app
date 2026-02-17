/**
 * Menu Stack Layout
 * Nested stack navigator within the Menu tab
 *
 * RTL Note: We use fade animation instead of slide to avoid RTL animation issues on Android.
 * The slide animation direction can break RTL layout on some Android devices.
 */

import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '../../../src/theme';

export default function MenuStackLayout() {
  const theme = useTheme();

  // Use fade animation on Android to avoid RTL animation issues
  // iOS handles RTL animations correctly with slide
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
        // Native back button: arrow only, no text
        headerBackButtonDisplayMode: 'minimal',
        // RTL-safe animation
        animation: animation,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'المزيد',
        }}
      />
      <Stack.Screen
        name="my-listings"
        options={{
          title: 'إعلاناتي',
        }}
      />
      <Stack.Screen
        name="wishlist"
        options={{
          title: 'المفضلة',
        }}
      />
      <Stack.Screen
        name="subscriptions"
        options={{
          title: 'الاشتراكات',
        }}
      />
      <Stack.Screen
        name="advertise"
        options={{
          title: 'أعلن معنا',
        }}
      />
      <Stack.Screen
        name="contact"
        options={{
          title: 'تواصل معنا',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'الإعدادات',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'تعديل الملف الشخصي',
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: 'المساعدة',
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: 'سياسة الخصوصية',
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          title: 'الشروط والأحكام',
        }}
      />
      <Stack.Screen
        name="blocked-users"
        options={{
          title: 'قائمة الحظر',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'الإحصائيات',
        }}
      />
      <Stack.Screen
        name="payments"
        options={{
          title: 'المدفوعات',
        }}
      />
    </Stack>
  );
}
