/**
 * Analytics Screen
 * Shows listing statistics and analytics summary
 * Requires analyticsAccess subscription feature
 * Matches web: /dashboard/analytics
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Eye,
  Heart,
  TrendingUp,
  Activity,
  Crown,
  Lock,
} from 'lucide-react-native';
import { useTheme, Theme } from '../../../src/theme';
import { Text, Button, Loading } from '../../../src/components/slices';
import { useListingAnalyticsStore } from '../../../src/stores/listingAnalyticsStore';
import { useUserAuthStore } from '../../../src/stores/userAuthStore';

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: 7, label: '7 أيام' },
  { value: 30, label: '30 يوم' },
  { value: 90, label: '90 يوم' },
  { value: -1, label: 'كل الوقت' },
];

export default function AnalyticsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  // Auth state
  const { isAuthenticated, userPackage } = useUserAuthStore();
  const hasAnalyticsAccess = userPackage?.userSubscription?.analyticsAccess;

  // Analytics store
  const {
    analyticsSummary,
    isLoading,
    error,
    fetchAnalyticsSummary,
    clearError,
  } = useListingAnalyticsStore();

  // Local state
  const [dateRange, setDateRange] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load analytics on mount (if has access)
  useEffect(() => {
    if (isAuthenticated && hasAnalyticsAccess) {
      fetchAnalyticsSummary(dateRange);
    }
  }, [isAuthenticated, hasAnalyticsAccess, dateRange]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAnalyticsSummary(dateRange);
    setIsRefreshing(false);
  }, [fetchAnalyticsSummary, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
  };

  // Handle listing select - navigate to listing detail
  const handleListingSelect = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  // Format number with commas
  const formatNumber = (num: number) => num.toLocaleString('en-US');

  // Performance indicator helpers
  const getPerformanceLabel = (indicator: string) => {
    switch (indicator) {
      case 'excellent':
        return 'ممتاز';
      case 'good':
        return 'جيد';
      case 'poor':
        return 'ضعيف';
      case 'very_poor':
        return 'ضعيف جداً';
      default:
        return indicator;
    }
  };

  const getPerformanceColor = (indicator: string) => {
    switch (indicator) {
      case 'excellent':
        return theme.colors.success;
      case 'good':
        return theme.colors.info;
      case 'poor':
        return theme.colors.warning;
      case 'very_poor':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <BarChart3 size={64} color={theme.colors.textMuted} strokeWidth={1} />
          <Text variant="h4" color="secondary" style={styles.emptyTitle}>
            قم بتسجيل الدخول
          </Text>
          <Text variant="paragraph" color="muted" center style={styles.emptySubtitle}>
            سجل دخولك لعرض إحصائيات إعلاناتك
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/auth/login')}
            style={styles.emptyButton}
          >
            تسجيل الدخول
          </Button>
        </View>
      </View>
    );
  }

  // No analytics access - need upgrade
  if (!hasAnalyticsAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.lockedIconContainer}>
            <Lock size={32} color={theme.colors.warning} />
          </View>
          <Text variant="h4" color="secondary" style={styles.emptyTitle}>
            ميزة غير متاحة
          </Text>
          <Text variant="paragraph" color="muted" center style={styles.emptySubtitle}>
            الإحصائيات المتقدمة متاحة فقط في{'\n'}خطط التاجر والأعمال
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/user-subscriptions')}
            style={styles.emptyButton}
            icon={<Crown size={18} color={theme.colors.surface} />}
          >
            ترقية الاشتراك
          </Button>
        </View>
      </View>
    );
  }

  // Loading state (initial load)
  if (isLoading && !analyticsSummary) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loading type="svg" />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            جاري تحميل الإحصائيات...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !analyticsSummary) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <BarChart3 size={64} color={theme.colors.error} strokeWidth={1} />
          <Text variant="h4" color="error" style={styles.emptyTitle}>
            حدث خطأ
          </Text>
          <Text variant="paragraph" color="secondary" center style={styles.emptySubtitle}>
            {error}
          </Text>
          <Button
            variant="primary"
            onPress={() => {
              clearError();
              fetchAnalyticsSummary(dateRange);
            }}
            style={styles.emptyButton}
          >
            إعادة المحاولة
          </Button>
        </View>
      </View>
    );
  }

  // Empty state - no data
  if (!analyticsSummary) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <BarChart3 size={64} color={theme.colors.textMuted} strokeWidth={1} />
          <Text variant="h4" color="secondary" style={styles.emptyTitle}>
            لا توجد إحصائيات
          </Text>
          <Text variant="paragraph" color="muted" center style={styles.emptySubtitle}>
            قم بنشر إعلانات لعرض الإحصائيات والتحليلات
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <BarChart3 size={24} color={theme.colors.primary} />
          <Text variant="h3">الإحصائيات</Text>
        </View>
        <Text variant="small" color="secondary">
          تحليل شامل لأداء إعلاناتك
        </Text>
      </View>

      {/* Date Range Selector */}
      <View style={styles.dateRangeContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRangeScroll}
        >
          {DATE_RANGE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.dateRangeButton,
                dateRange === option.value && styles.dateRangeButtonActive,
              ]}
              onPress={() => handleDateRangeChange(option.value)}
            >
              <Text
                variant="small"
                color={dateRange === option.value ? 'surface' : 'secondary'}
                style={dateRange === option.value ? styles.dateRangeTextActive : undefined}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Summary Stats Grid */}
      <View style={styles.statsSection}>
        <Text variant="h4" style={styles.sectionTitle}>
          نظرة عامة - جميع الإعلانات
        </Text>

        <View style={styles.statsGrid}>
          {/* Total Views */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Eye size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text variant="h3">{formatNumber(analyticsSummary.totalViews)}</Text>
              <Text variant="xs" color="secondary">
                إجمالي المشاهدات
              </Text>
              {analyticsSummary.totalViewsToday > 0 && (
                <Text variant="xs" color="success">
                  +{formatNumber(analyticsSummary.totalViewsToday)} اليوم
                </Text>
              )}
            </View>
          </View>

          {/* Total Wishlists */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.error}15` }]}>
              <Heart size={20} color={theme.colors.error} />
            </View>
            <View style={styles.statContent}>
              <Text variant="h3">{formatNumber(analyticsSummary.totalWishlists)}</Text>
              <Text variant="xs" color="secondary">
                المفضلة
              </Text>
              {analyticsSummary.totalWishlistsToday > 0 && (
                <Text variant="xs" color="success">
                  +{formatNumber(analyticsSummary.totalWishlistsToday)} اليوم
                </Text>
              )}
            </View>
          </View>

          {/* Active Listings */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.success}15` }]}>
              <TrendingUp size={20} color={theme.colors.success} />
            </View>
            <View style={styles.statContent}>
              <Text variant="h3">{formatNumber(analyticsSummary.activeListingsCount)}</Text>
              <Text variant="xs" color="secondary">
                الإعلانات النشطة
              </Text>
            </View>
          </View>

          {/* Engagement Rate */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.info}15` }]}>
              <Activity size={20} color={theme.colors.info} />
            </View>
            <View style={styles.statContent}>
              <Text variant="h3">{analyticsSummary.avgEngagementRate.toFixed(1)}%</Text>
              <Text variant="xs" color="secondary">
                معدل التفاعل
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Top Performers List */}
      {analyticsSummary.topPerformers.length > 0 && (
        <View style={styles.listingsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="h4">إعلاناتك</Text>
            <Text variant="xs" color="secondary">
              اضغط للتفاصيل
            </Text>
          </View>

          {analyticsSummary.topPerformers.map((listing) => (
            <Pressable
              key={listing.id}
              style={styles.listingCard}
              onPress={() => handleListingSelect(listing.id)}
            >
              <View style={styles.listingInfo}>
                <Text variant="body" numberOfLines={2} style={styles.listingTitle}>
                  {listing.title}
                </Text>
                <View style={styles.listingStats}>
                  <View style={styles.listingStat}>
                    <Eye size={14} color={theme.colors.textMuted} />
                    <Text variant="xs" color="secondary">
                      {formatNumber(listing.viewCount)}
                    </Text>
                  </View>
                  <View style={styles.listingStat}>
                    <Heart size={14} color={theme.colors.textMuted} />
                    <Text variant="xs" color="secondary">
                      {formatNumber(listing.wishlistCount)}
                    </Text>
                  </View>
                  <View style={styles.listingStat}>
                    <Activity size={14} color={theme.colors.textMuted} />
                    <Text variant="xs" color="secondary">
                      {listing.engagementRate.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.performanceBadge,
                  { backgroundColor: getPerformanceColor(listing.performanceIndicator) },
                ]}
              >
                <Text variant="xs" style={styles.performanceBadgeText}>
                  {getPerformanceLabel(listing.performanceIndicator)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Empty listings state */}
      {analyticsSummary.topPerformers.length === 0 && (
        <View style={styles.noListingsState}>
          <Text variant="paragraph" color="secondary" center>
            لا توجد إعلانات نشطة لعرض إحصائياتها
          </Text>
          <Button
            variant="outline"
            onPress={() => router.push('/create/wizard')}
            style={styles.createButton}
          >
            إضافة إعلان جديد
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    content: {
      paddingBottom: theme.spacing.xl * 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.md,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyTitle: {
      marginTop: theme.spacing.md,
    },
    emptySubtitle: {
      marginTop: theme.spacing.sm,
      lineHeight: 22,
    },
    emptyButton: {
      marginTop: theme.spacing.lg,
    },
    lockedIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${theme.colors.warning}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    header: {
      backgroundColor: theme.colors.bg,
      padding: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    headerRow: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    dateRangeContainer: {
      backgroundColor: theme.colors.bg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dateRangeScroll: {
      paddingStart: theme.spacing.md,
        paddingEnd: theme.spacing.md,
      gap: theme.spacing.sm,
      flexDirection: 'row',
    },
    dateRangeButton: {
      paddingStart: theme.spacing.md,
        paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateRangeButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    dateRangeTextActive: {
      fontWeight: '600',
    },
    statsSection: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
    },
    statsGrid: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    statCard: {
      width: '47%',
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      alignItems: 'center',
      gap: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statContent: {
      flex: 1,
      alignItems: theme.isRTL ? 'flex-end' : 'flex-start',
    },
    listingsSection: {
      padding: theme.spacing.lg,
      paddingTop: 0,
    },
    sectionHeaderRow: {
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    listingCard: {
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    listingInfo: {
      flex: 1,
      alignItems: theme.isRTL ? 'flex-end' : 'flex-start',
      marginRight: theme.isRTL ? 0 : theme.spacing.md,
      marginLeft: theme.isRTL ? theme.spacing.md : 0,
    },
    listingTitle: {
      marginBottom: theme.spacing.xs,
    },
    listingStats: {
      gap: theme.spacing.md,
    },
    listingStat: {
      alignItems: 'center',
      gap: 4,
    },
    performanceBadge: {
      paddingStart: theme.spacing.sm,
        paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
    },
    performanceBadgeText: {
      color: '#fff',
      fontWeight: '600',
    },
    noListingsState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    createButton: {
      marginTop: theme.spacing.md,
    },
  });
