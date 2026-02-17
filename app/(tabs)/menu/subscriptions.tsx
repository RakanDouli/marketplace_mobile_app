/**
 * My Subscription Screen (Dashboard Style)
 * Shows user's current subscription details, warnings, and upgrade/extend options
 * Matches web: /dashboard/subscription
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { CreditCard, Check, X, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { Text, Button } from '../../../src/components/ui';
import { useUserAuthStore } from '../../../src/stores/userAuthStore';
import { useCurrencyStore } from '../../../src/stores/currencyStore';
import { formatPrice } from '../../../src/utils/formatPrice';

// Account type labels
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: 'خطة فردية',
  dealer: 'خطة تاجر',
  business: 'خطة أعمال',
};

export default function SubscriptionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);
  const { user, userPackage, isAuthenticated } = useUserAuthStore();
  const preferredCurrency = useCurrencyStore((state) => state.preferredCurrency);

  // Get subscription data from userPackage
  const subscription = userPackage?.userSubscription;
  const currentListingsCount = userPackage?.currentListings || 0;

  // Build features list
  const features = subscription ? [
    {
      name: subscription.maxListings === 0 ? 'إعلانات غير محدودة' : `${subscription.maxListings} إعلانات`,
      included: true,
    },
    { name: `${subscription.maxImagesPerListing} صور لكل إعلان`, included: true },
    { name: 'دعم الفيديو', included: subscription.videoAllowed },
    { name: 'أولوية في البحث', included: subscription.priorityPlacement },
    { name: 'تحليلات متقدمة', included: subscription.analyticsAccess },
    { name: 'علامة تجارية مخصصة', included: subscription.customBranding },
    { name: 'إعلانات مميزة', included: subscription.featuredListings },
  ] : [];

  // Free plan check: no subscription OR monthlyPrice is 0/null/undefined
  const isFree = !subscription || !subscription.monthlyPrice || subscription.monthlyPrice === 0;
  const accountType = user?.user_metadata?.account_type || 'individual';
  const isBusinessAccount = accountType === 'business';
  const canUpgrade = !isBusinessAccount;
  // Only show Renew/Extend button for paid plans (not free)
  const canExtend = !isFree;

  // Expiry calculations
  const endDate = userPackage?.endDate ? new Date(userPackage.endDate) : null;
  const now = new Date();
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  // Over-limit calculations
  const maxListings = subscription?.maxListings || 0;
  const isOverLimit = maxListings > 0 && currentListingsCount > maxListings;
  const overLimitCount = isOverLimit ? currentListingsCount - maxListings : 0;

  const handleUpgrade = () => {
    router.push('/user-subscriptions');
  };

  const handleExtend = () => {
    router.push('/user-subscriptions');
  };

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <CreditCard size={64} color={theme.colors.textMuted} strokeWidth={1} />
          <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
            قم بتسجيل الدخول
          </Text>
          <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
            سجل دخولك لعرض اشتراكك الحالي
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/auth/login')}
            style={{ marginTop: 20 }}
          >
            تسجيل الدخول
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <CreditCard size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text variant="h3">الاشتراك الحالي</Text>
            {subscription && (
              <Text variant="small" color="secondary">{subscription.title}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Warning Banners */}
      {!isFree && isExpiringSoon && (
        <View style={styles.warningBanner}>
          <View style={styles.warningContent}>
            <AlertTriangle size={20} color={theme.colors.warning} />
            <Text variant="paragraph" style={styles.warningText}>
              اشتراكك سينتهي خلال {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'}! قم بتجديد اشتراكك للاستمرار في الاستفادة من جميع الميزات.
            </Text>
          </View>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleExtend}
            style={{ alignSelf: 'flex-end', marginTop: 12 }}
          >
            تجديد الاشتراك
          </Button>
        </View>
      )}

      {!isFree && isExpired && (
        <View style={[styles.warningBanner, styles.errorBanner]}>
          <AlertTriangle size={20} color={theme.colors.error} />
          <Text variant="paragraph" style={styles.errorText}>
            انتهى اشتراكك! قم بتجديد اشتراكك للاستمرار في الاستفادة من جميع الميزات.
          </Text>
        </View>
      )}

      {isOverLimit && (
        <View style={[styles.warningBanner, styles.errorBanner]}>
          <AlertTriangle size={20} color={theme.colors.error} />
          <View style={{ flex: 1 }}>
            <Text variant="body" style={[styles.errorText, { fontWeight: '600' }]}>
              لقد تجاوزت الحد المسموح للإعلانات!
            </Text>
            <Text variant="small" style={styles.errorText}>
              لديك {currentListingsCount} إعلانات نشطة، بينما خطتك تسمح بـ {maxListings} فقط.
              لن تتمكن من إضافة إعلانات جديدة حتى تقوم بأرشفة {overLimitCount} إعلانات أو ترقية اشتراكك.
            </Text>
          </View>
        </View>
      )}

      {/* Subscription Card */}
      <View style={styles.subscriptionCard}>
        {/* Plan Header with Price */}
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Text variant="h3">{subscription?.title || 'لا يوجد اشتراك'}</Text>
            <Text variant="small" color="secondary">
              {ACCOUNT_TYPE_LABELS[accountType]}
            </Text>
          </View>
          <View style={styles.priceSection}>
            <Text variant="h2" style={{ color: theme.colors.primary }}>
              {formatPrice(subscription?.monthlyPrice || 0, preferredCurrency)}
            </Text>
            <Text variant="xs" color="muted">
              {subscription?.monthlyPrice === 0 ? 'مجاناً' : '/ شهرياً'}
            </Text>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text variant="h4" style={styles.featuresTitle}>الميزات المتاحة</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureItem,
                  feature.included ? styles.featureIncluded : styles.featureNotIncluded,
                ]}
              >
                <Text variant="small" style={[
                  styles.featureText,
                  !feature.included && { color: theme.colors.textMuted },
                ]}>
                  {feature.name}
                </Text>
                {feature.included ? (
                  <Check size={16} color={theme.colors.success} />
                ) : (
                  <X size={16} color={theme.colors.textMuted} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Footer: Expiration + Actions */}
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            {!isFree && endDate && (
              <Text variant="small" color="secondary">
                ينتهي الاشتراك في {endDate.toLocaleDateString('ar-EG')}
              </Text>
            )}
            {isFree && !isBusinessAccount && (
              <Text variant="small" color="secondary">
                يمكنك ترقية اشتراكك للحصول على ميزات إضافية
              </Text>
            )}
            {isBusinessAccount && (
              <Text variant="small" color="secondary">
                أنت مشترك في أعلى خطة متاحة
              </Text>
            )}
          </View>
          <View style={styles.footerActions}>
            {canExtend && (
              <Button variant="outline" onPress={handleExtend} style={{ flex: 1 }}>
                تجديد
              </Button>
            )}
            {canUpgrade && (
              <Button variant="primary" arrow onPress={handleUpgrade} style={{ flex: 1 }}>
                ترقية
              </Button>
            )}
          </View>
        </View>
      </View>

      {/* View All Plans Link */}
      <View style={styles.viewPlansLink}>
        <Button
          variant="link"
          arrow
          onPress={() => router.push('/user-subscriptions')}
        >
          عرض جميع الخطط المتاحة
        </Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    content: {
      paddingBottom: 40,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    // Header
    headerSection: {
      backgroundColor: theme.colors.bg,
      padding: 20,
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerInfo: {
      flex: 1,
      marginRight: 12,
      alignItems: 'flex-end',
    },
    // Warning Banners
    warningBanner: {
      backgroundColor: `${theme.colors.warning}15`,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: theme.radius.md,
      padding: 16,
      borderWidth: 1,
      borderColor: `${theme.colors.warning}30`,
    },
    warningContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    warningText: {
      flex: 1,
      textAlign: 'right',
      color: theme.colors.warning,
    },
    errorBanner: {
      backgroundColor: `${theme.colors.error}10`,
      borderColor: `${theme.colors.error}30`,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'right',
    },
    // Subscription Card
    subscriptionCard: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      padding: 20,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    planInfo: {
      alignItems: 'flex-end',
    },
    priceSection: {
      alignItems: 'flex-start',
    },
    // Features
    featuresSection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 16,
      marginBottom: 20,
    },
    featuresTitle: {
      marginBottom: 12,
      textAlign: 'right',
    },
    featuresGrid: {
      gap: 8,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.radius.sm,
      gap: 8,
    },
    featureIncluded: {
      backgroundColor: `${theme.colors.success}10`,
    },
    featureNotIncluded: {
      backgroundColor: theme.colors.surface,
    },
    featureText: {
      flex: 1,
      textAlign: 'right',
    },
    // Footer
    footer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 16,
    },
    footerInfo: {
      marginBottom: 12,
    },
    footerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    // View Plans Link
    viewPlansLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 20,
      paddingVertical: 16,
    },
  });
