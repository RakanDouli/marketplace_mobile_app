/**
 * Main Tab Navigator
 * Bottom tabs: Home, Categories, CreateListing, Messages, Profile
 */

import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { useTheme } from '../theme';
import {
  Home,
  Grid3X3,
  PlusCircle,
  MessageCircle,
  User,
} from 'lucide-react-native';

// Screen stacks (will be created)
import HomeStack from './stacks/HomeStack';
import CategoriesStack from './stacks/CategoriesStack';
import CreateListingStack from './stacks/CreateListingStack';
import MessagesStack from './stacks/MessagesStack';
import ProfileStack from './stacks/ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon size
const ICON_SIZE = 24;

export function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.bg,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Rubik-Medium',
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesStack}
        options={{
          tabBarLabel: 'الأقسام',
          tabBarIcon: ({ color, focused }) => (
            <Grid3X3
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CreateListing"
        component={CreateListingStack}
        options={{
          tabBarLabel: 'أضف إعلان',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.createListingIcon}>
              <PlusCircle
                size={32}
                color={theme.colors.primary}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarLabel: 'الرسائل',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          // TODO: Add badge for unread messages
          // tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'حسابي',
          tabBarIcon: ({ color, focused }) => (
            <User
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  createListingIcon: {
    marginTop: -8,
  },
});

export default MainTabs;
