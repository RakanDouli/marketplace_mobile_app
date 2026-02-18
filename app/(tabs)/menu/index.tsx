/**
 * Menu Screen
 * Main menu/drawer with user profile, theme/currency settings, and navigation options
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Text, Button } from '../../../src/components/slices';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  FileText,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  CreditCard,
  Megaphone,
  Mail,
  HelpCircle,
  Shield,
  Sun,
  Moon,
  Monitor,
  Ban,
  BarChart3,
  Receipt,
  Crown,
} from 'lucide-react-native';
import { useTheme, useThemeMode } from '../../../src/theme';
import { useUserAuthStore } from '../../../src/stores/userAuthStore';
import { useCurrencyStore, CURRENCY_SYMBOLS, CURRENCY_LABELS, type Currency } from '../../../src/stores/currencyStore';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  route: string;
  dividerAfter?: boolean;
}

export default function MenuScreen() {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();
  const router = useRouter();
  const { user, signOut, isAuthenticated } = useUserAuthStore();
  const { preferredCurrency, setPreferredCurrency } = useCurrencyStore();

  const styles = createStyles(theme);

  // Theme options
  const themeOptions: { mode: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun size={18} color={themeMode === 'light' ? theme.colors.primary : theme.colors.textMuted} />, label: 'فاتح' },
    { mode: 'dark', icon: <Moon size={18} color={themeMode === 'dark' ? theme.colors.primary : theme.colors.textMuted} />, label: 'داكن' },
    { mode: 'system', icon: <Monitor size={18} color={themeMode === 'system' ? theme.colors.primary : theme.colors.textMuted} />, label: 'تلقائي' },
  ];

  // Currency options
  const currencyOptions: Currency[] = ['USD', 'EUR', 'SYP'];

  // Check if user has analytics access from subscription
  const hasAnalyticsAccess = user?.user_metadata?.subscription?.analyticsAccess === true;

  // Menu items grouped by section - matching web dashboard
  const accountMenuItems: MenuItem[] = [
    {
      icon: <User size={22} color={theme.colors.text} />,
      label: 'معلومات الحساب',
      route: '/menu/edit-profile',
    },
    {
      icon: <FileText size={22} color={theme.colors.text} />,
      label: 'إعلاناتي',
      route: '/menu/my-listings',
    },
    {
      icon: <Heart size={22} color={theme.colors.text} />,
      label: 'المفضلة',
      route: '/menu/wishlist',
    },
    {
      icon: <Ban size={22} color={theme.colors.text} />,
      label: 'قائمة الحظر',
      route: '/menu/blocked-users',
    },
    {
      icon: <CreditCard size={22} color={theme.colors.text} />,
      label: 'الاشتراك',
      route: '/menu/subscriptions',
    },
    // Analytics - only if subscription includes analytics access
    ...(hasAnalyticsAccess ? [{
      icon: <BarChart3 size={22} color={theme.colors.text} />,
      label: 'الإحصائيات',
      route: '/menu/analytics',
    }] : []),
    {
      icon: <Receipt size={22} color={theme.colors.text} />,
      label: 'المدفوعات',
      route: '/menu/payments',
      dividerAfter: true,
    },
  ];

  // Advertising & Subscriptions section
  const advertisingMenuItems: MenuItem[] = [
    {
      icon: <Crown size={22} color={theme.colors.text} />,
      label: 'باقات الاشتراك',
      route: '/user-subscriptions',
    },
    {
      icon: <Megaphone size={22} color={theme.colors.text} />,
      label: 'أعلن معنا',
      route: '/menu/advertise',
      dividerAfter: true,
    },
  ];

  const supportMenuItems: MenuItem[] = [
    {
      icon: <Mail size={22} color={theme.colors.text} />,
      label: 'تواصل معنا',
      route: '/menu/contact',
    },
    {
      icon: <HelpCircle size={22} color={theme.colors.text} />,
      label: 'المساعدة',
      route: '/menu/help',
    },
    {
      icon: <Shield size={22} color={theme.colors.text} />,
      label: 'سياسة الخصوصية',
      route: '/menu/privacy',
    },
    {
      icon: <FileText size={22} color={theme.colors.text} />,
      label: 'الشروط والأحكام',
      route: '/menu/terms',
    },
    {
      icon: <Settings size={22} color={theme.colors.text} />,
      label: 'الإعدادات',
      route: '/menu/settings',
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => (
    <React.Fragment key={index}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push(item.route as any)}
      >
        {/* RTL Layout: Chevron left, content right */}
        <ChevronLeft size={20} color={theme.colors.textMuted} />
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemLabel}>{item.label}</Text>
          {item.icon}
        </View>
      </TouchableOpacity>
      {item.dividerAfter && <View style={styles.divider} />}
    </React.Fragment>
  );

  // Settings Section (Theme & Currency)
  const renderSettingsSection = () => (
    <View style={styles.settingsSection}>
      {/* Theme Toggle */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>المظهر</Text>
        <View style={styles.toggleGroup}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.toggleButton,
                themeMode === option.mode && styles.toggleButtonActive,
              ]}
              onPress={() => setThemeMode(option.mode)}
            >
              {option.icon}
              <Text
                style={[
                  styles.toggleButtonText,
                  themeMode === option.mode && styles.toggleButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Currency Selector */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>العملة</Text>
        <View style={styles.toggleGroup}>
          {currencyOptions.map((currency) => (
            <TouchableOpacity
              key={currency}
              style={[
                styles.toggleButton,
                preferredCurrency === currency && styles.toggleButtonActive,
              ]}
              onPress={() => setPreferredCurrency(currency)}
            >
              <Text
                style={[
                  styles.currencySymbol,
                  preferredCurrency === currency && styles.toggleButtonTextActive,
                ]}
              >
                {CURRENCY_SYMBOLS[currency]}
              </Text>
              <Text
                style={[
                  styles.toggleButtonText,
                  preferredCurrency === currency && styles.toggleButtonTextActive,
                ]}
              >
                {currency}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Guest view (not logged in)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Guest Header - RTL: info left, avatar right */}
          <View style={styles.guestHeader}>
            <View style={styles.guestInfo}>
              <Text style={styles.guestTitle}>مرحباً بك!</Text>
              <Text style={styles.guestSubtitle}>
                قم بتسجيل الدخول للوصول إلى جميع الميزات
              </Text>
            </View>
            <View style={styles.avatar}>
              <User size={40} color={theme.colors.textMuted} />
            </View>
          </View>

          {/* Login Button */}
          <Button
            variant="primary"
            onPress={() => router.push('/auth/login')}
            fullWidth
            style={{ marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.md }}
          >
            تسجيل الدخول
          </Button>

          {/* Theme & Currency Settings */}
          {renderSettingsSection()}

          {/* Support & Info Menu */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>المساعدة والدعم</Text>
            <View style={styles.menu}>
              {supportMenuItems.map(renderMenuItem)}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Authenticated user view
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Profile Header - RTL: Chevron left, info middle, avatar right */}
        <TouchableOpacity
          style={styles.header}
          onPress={() => router.push('/menu/edit-profile')}
        >
          <ChevronLeft size={24} color={theme.colors.textMuted} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || 'المستخدم'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <View style={styles.avatar}>
            {user?.user_metadata?.avatar_url ? (
              <Image
                source={{ uri: user.user_metadata.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <User size={40} color={theme.colors.primary} />
            )}
          </View>
        </TouchableOpacity>

        {/* Theme & Currency Settings */}
        {renderSettingsSection()}

        {/* Account Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>حسابي</Text>
          <View style={styles.menu}>
            {accountMenuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* Subscriptions & Advertising Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>الباقات والإعلانات</Text>
          <View style={styles.menu}>
            {advertisingMenuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* Support & Settings Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>المساعدة والإعدادات</Text>
          <View style={styles.menu}>
            {supportMenuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* Logout Button */}
        <Button
          variant="danger"
          icon={<LogOut size={20} color="#FFFFFF" />}
          onPress={signOut}
          fullWidth
          style={{ marginHorizontal: theme.spacing.md, marginTop: theme.spacing.sm }}
        >
          تسجيل الخروج
        </Button>

        {/* Version Info */}
        <Text style={styles.versionText}>الإصدار 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface, // Page background = surface
    },
    // Header styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.bg, // Clickable card = bg
      marginBottom: theme.spacing.md,
    },
    guestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.bg, // Clickable card = bg
      marginBottom: theme.spacing.md,
    },
    avatar: {
      width: theme.layout.avatarSizeLg,
      height: theme.layout.avatarSizeLg,
      borderRadius: theme.layout.avatarSizeLg / 2,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: theme.layout.avatarSizeLg,
      height: theme.layout.avatarSizeLg,
      borderRadius: theme.layout.avatarSizeLg / 2,
    },
    userInfo: {
      flex: 1,
      marginHorizontal: theme.spacing.lg,
    },
    guestInfo: {
      flex: 1,
      marginHorizontal: theme.spacing.lg,
    },
    userName: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fontFamily.header,
      color: theme.colors.text,
      textAlign: 'right',
    },
    userEmail: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fontFamily.body,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    guestTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fontFamily.header,
      color: theme.colors.text,
      textAlign: 'right',
    },
    guestSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fontFamily.body,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    // Menu section styles
    menuSection: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fontFamily.bodyMedium,
      color: theme.colors.textMuted,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    menu: {
      backgroundColor: theme.colors.bg, // Clickable items = bg
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuItemContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end', // RTL: content aligned to right
      gap: theme.spacing.lg,
    },
    menuItemLabel: {
      fontSize: theme.fontSize.base,
      fontFamily: theme.fontFamily.body,
      color: theme.colors.text,
    },
    divider: {
      height: theme.spacing.sm,
      backgroundColor: theme.colors.surface, // Divider matches page bg
    },
    // Version text
    versionText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fontFamily.body,
      color: theme.colors.textMuted,
      textAlign: 'center',
      paddingVertical: theme.spacing.md,
    },
    // Settings section styles
    settingsSection: {
      backgroundColor: theme.colors.bg, // Card/section = bg
      marginBottom: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    settingRow: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    settingLabel: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fontFamily.bodyMedium,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
      textAlign: 'right',
    },
    toggleGroup: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.surface, // Inactive toggle = surface
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    toggleButtonActive: {
      backgroundColor: theme.colors.primaryLight,
      borderColor: theme.colors.primary,
    },
    toggleButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fontFamily.body,
      color: theme.colors.textMuted,
    },
    toggleButtonTextActive: {
      color: theme.colors.primary,
      fontFamily: theme.fontFamily.bodyMedium,
    },
    currencySymbol: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fontFamily.bodyMedium,
      color: theme.colors.textMuted,
    },
  });
