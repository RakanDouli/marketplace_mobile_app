/**
 * Tabs Layout - Platform-specific Tab Navigation
 *
 * iOS: Uses NativeTabs (native UITabBarController) - RTL works correctly
 * Android: Uses Tabs (React Navigation) - avoids RTL bugs in NativeTabs
 *
 * Tab order (visual, right to left for RTL): Search, Home, Add, Messages, More
 */

import React, { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label, VectorIcon, Badge } from 'expo-router/unstable-native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../src/theme';
import { useChatStore } from '../../src/stores/chatStore';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

// Define tabs in visual order (RIGHT to LEFT for RTL)
const TAB_CONFIG = [
  {
    name: 'search',
    label: 'بحث',
    icon: 'search' as const,
    iconOutline: 'search-outline' as const,
    sfIcon: { default: 'magnifyingglass', selected: 'magnifyingglass' },
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
  const { unreadCount, fetchUnreadCount, fetchMyThreads, subscribeGlobal, unsubscribeGlobal } = useChatStore();
  const { user } = useUserAuthStore();

  // Subscribe to global realtime for instant unread count updates
  useEffect(() => {
    if (user?.id) {
      // Fetch threads first, then subscribe
      fetchMyThreads().then(() => {
        fetchUnreadCount();
        subscribeGlobal(user.id);
      });

      return () => {
        unsubscribeGlobal();
      };
    }
  }, [user?.id]);

  return (
    <NativeTabs tintColor={theme.colors.primary}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger
          key={tab.name}
          name={tab.name}
          role={tab.role}
        >
          <Icon
            sf={tab.sfIcon as any}
            androidSrc={<VectorIcon family={Ionicons} name={tab.icon} />}
          />
          <Label>{tab.label}</Label>
          {tab.name === 'messages' && unreadCount > 0 && (
            <Badge>{unreadCount > 99 ? '99+' : unreadCount.toString()}</Badge>
          )}
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
  const { unreadCount, fetchUnreadCount, fetchMyThreads, subscribeGlobal, unsubscribeGlobal } = useChatStore();
  const { user } = useUserAuthStore();

  // Subscribe to global realtime for instant unread count updates
  useEffect(() => {
    if (user?.id) {
      // Fetch threads first, then subscribe
      fetchMyThreads().then(() => {
        fetchUnreadCount();
        subscribeGlobal(user.id);
      });

      return () => {
        unsubscribeGlobal();
      };
    }
  }, [user?.id]);

  return (
    <Tabs
      initialRouteName="index"
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
              <View>
                <Ionicons
                  name={focused ? tab.icon : tab.iconOutline}
                  size={size}
                  color={color}
                />
                {tab.name === 'messages' && unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.bg }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.textLight }]}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 20,
    height: 20,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default function TabsLayout() {
  // iOS: Use native tabs (RTL works fine)
  // Android: Use React Navigation tabs (avoids RTL bugs)
  return Platform.OS === 'ios' ? <IOSTabs /> : <AndroidTabs />;
}
