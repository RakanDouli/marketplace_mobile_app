/**
 * Profile Stack Navigator
 * User profile, listings management, settings
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { useTheme } from '../../theme';

// Screens
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import MyListingsScreen from '../../screens/Profile/MyListingsScreen';
import WishlistScreen from '../../screens/Profile/WishlistScreen';
import EditProfileScreen from '../../screens/Profile/EditProfileScreen';
import SettingsScreen from '../../screens/Profile/SettingsScreen';
import NotificationsScreen from '../../screens/Profile/NotificationsScreen';
import ArchivedListingsScreen from '../../screens/Profile/ArchivedListingsScreen';
import EditListingScreen from '../../screens/Profile/EditListingScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.bg,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Beiruti-Bold',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        animation: 'slide_from_left',
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          title: 'حسابي',
        }}
      />
      <Stack.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{
          title: 'إعلاناتي',
        }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          title: 'المفضلة',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'تعديل الملف الشخصي',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'الإعدادات',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'الإشعارات',
        }}
      />
      <Stack.Screen
        name="ArchivedListings"
        component={ArchivedListingsScreen}
        options={{
          title: 'الإعلانات المؤرشفة',
        }}
      />
      <Stack.Screen
        name="EditListing"
        component={EditListingScreen}
        options={{
          title: 'تعديل الإعلان',
        }}
      />
    </Stack.Navigator>
  );
}

export default ProfileStack;
