/**
 * Tabs Layout - Platform-specific Tab Navigation
 *
 * iOS: Uses NativeTabs (native UITabBarController) - RTL works correctly
 * Android: Uses Tabs (React Navigation) - avoids RTL bugs in NativeTabs
 *
 * Tab order (visual, right to left for RTL): Search, Home, Add, Messages, More
 */

import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../src/theme';

// Define tabs in visual order (RIGHT to LEFT for RTL)
const TAB_CONFIG = [
  {
    name: 'search',
    label: 'بحث',
    icon: 'search' as const,
    iconOutline: 'search-outline' as const,
    sfIcon: 'magnifyingglass',
    role: 'search' as const,
  },
  {
    name: 'index',
    label: 'الرئيسية',
    icon: 'home' as const,
    iconOutline: 'home-outline' as const,
    sfIcon: { default: 'house', selected: 'house.fill' },
  },
  {
    name: 'create',
    label: 'إضافة',
    icon: 'add-circle' as const,
    iconOutline: 'add-circle-outline' as const,
    sfIcon: { default: 'plus.circle', selected: 'plus.circle.fill' },
  },
  {
    name: 'messages',
    label: 'الرسائل',
    icon: 'chatbubble' as const,
    iconOutline: 'chatbubble-outline' as const,
    sfIcon: { default: 'message', selected: 'message.fill' },
  },
  {
    name: 'menu',
    label: 'المزيد',
    icon: 'ellipsis-horizontal-circle' as const,
    iconOutline: 'ellipsis-horizontal-circle-outline' as const,
    sfIcon: { default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' },
  },
];

/**
 * iOS: Native tab bar (UITabBarController)
 */
function IOSTabs() {
  const theme = useTheme();
  const tabs = [...TAB_CONFIG].reverse();

  return (
    <NativeTabs tintColor={theme.colors.primary}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name} role={tab.role}>
          <Icon
            sf={tab.sfIcon}
            androidSrc={<VectorIcon family={Ionicons} name={tab.icon} />}
          />
          <Label>{tab.label}</Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

/**
 * Android: React Navigation tabs (avoids RTL bugs)
 */
function AndroidTabs() {
  const theme = useTheme();
  const tabs = [...TAB_CONFIG].reverse();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.bg,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily.body,
          fontSize: 11,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

export default function TabsLayout() {
  // iOS: Use native tabs (RTL works fine)
  // Android: Use React Navigation tabs (avoids RTL bugs)
  return Platform.OS === 'ios' ? <IOSTabs /> : <AndroidTabs />;
}
