/**
 * Profile Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  User,
  FileText,
  Heart,
  Settings,
  Bell,
  Archive,
  LogOut,
  ChevronLeft,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useUserAuthStore } from '../../stores/userAuthStore';
import { ProfileStackScreenProps } from '../../navigation/types';

type NavigationProp = ProfileStackScreenProps<'ProfileScreen'>['navigation'];

export default function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut, isAuthenticated } = useUserAuthStore();

  const styles = createStyles(theme);

  const menuItems = [
    {
      icon: <FileText size={22} color={theme.colors.text} />,
      label: 'إعلاناتي',
      onPress: () => navigation.navigate('MyListings'),
    },
    {
      icon: <Heart size={22} color={theme.colors.text} />,
      label: 'المفضلة',
      onPress: () => navigation.navigate('Wishlist'),
    },
    {
      icon: <Archive size={22} color={theme.colors.text} />,
      label: 'الإعلانات المؤرشفة',
      onPress: () => navigation.navigate('ArchivedListings'),
    },
    {
      icon: <Bell size={22} color={theme.colors.text} />,
      label: 'الإشعارات',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: <Settings size={22} color={theme.colors.text} />,
      label: 'الإعدادات',
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInTitle}>لم تقم بتسجيل الدخول</Text>
          <Text style={styles.notLoggedInText}>
            قم بتسجيل الدخول للوصول إلى حسابك
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={40} color={theme.colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || 'المستخدم'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                {item.icon}
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <ChevronLeft size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={22} color={theme.colors.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userInfo: {
      flex: 1,
      marginHorizontal: 12,
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'right',
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    editButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 8,
    },
    editButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    menu: {
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    menuItemLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    logoutText: {
      fontSize: 16,
      color: theme.colors.error,
      fontWeight: '500',
    },
    notLoggedIn: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    notLoggedInTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    notLoggedInText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
