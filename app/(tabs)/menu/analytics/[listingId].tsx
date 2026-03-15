/**
 * Listing Analytics Detail Screen
 * Shows detailed analytics for a specific listing
 * Includes stats cards, performance indicator bar, and views chart
 * Matches web: /dashboard/analytics/[listingId]
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import {
  BarChart3,
  Eye,
  Heart,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react-native';
import { useTheme, Theme } from '../../../../src/theme';
import { Text, Button, Loading } from '../../../../src/components/slices';
import { useListingAnalyticsStore } from '../../../../src/stores/listingAnalyticsStore';
import { useUserAuthStore } from '../../../../src/stores/userAuthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, right: 16, bottom: 30, left: 40 };

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: 7, label: '7 أيام' },
  { value: 30, label: '30 يوم' },
  { value: 90, label: '90 يوم' },
  { value: -1, label: 'كل الوقت' },
];

export default function ListingAnalyticsDetailScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();

  // Auth state
  const { isAuthenticated, userPackage } = useUserAuthStore();
  const hasAnalyticsAccess = userPackage?.userSubscription?.analyticsAccess;

  // Analytics store
  const {
    listingAnalytics,
    isLoading,
    error,
    fetchListingAnalytics,
    clearError,
  } = useListingAnalyticsStore();

  // Local state
  const [dateRange, setDateRange] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load analytics on mount
  useEffect(() => {
    if (isAuthenticated && hasAnalyticsAccess && listingId) {
      fetchListingAnalytics(listingId, dateRange);
    }
  }, [isAuthenticated, hasAnalyticsAccess, listingId, dateRange]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!listingId) return;
    setIsRefreshing(true);
    await fetchListingAnalytics(listingId, dateRange);
    setIsRefreshing(false);
  }, [fetchListingAnalytics, listingId, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
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

  // Get marker position based on performance indicator (0-100%)
  const getMarkerPosition = (indicator: string) => {
    switch (indicator) {
      case 'very_poor':
        return 0.08;
      case 'poor':
        return 0.28;
      case 'good':
        return 0.55;
      case 'excellent':
        return 0.85;
      default:
        return 0.5;
    }
  };

  // Format date for chart (e.g., "Nov 5")
  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Render line chart using SVG
  const renderLineChart = () => {
    if (!listingAnalytics?.viewsByDate || listingAnalytics.viewsByDate.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <BarChart3 size={48} color={theme.colors.textMuted} />
          <Text variant="paragraph" color="secondary" style={styles.chartPlaceholderText}>
            لا توجد بيانات مشاهدات بعد
          </Text>
        </View>
      );
    }

    const data = listingAnalytics.viewsByDate;
    const chartWidth = SCREEN_WIDTH - theme.spacing.lg * 2 - CHART_PADDING.left - CHART_PADDING.right;
    const chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    // Calculate min/max values
    const views = data.map((d) => d.views);
    const maxViews = Math.max(...views, 1);
    const minViews = 0;

    // Calculate points
    const points = data.map((d, i) => {
      const x = CHART_PADDING.left + (i / (data.length - 1 || 1)) * chartWidth;
      const y = CHART_PADDING.top + chartHeight - ((d.views - minViews) / (maxViews - minViews || 1)) * chartHeight;
      return { x, y, date: d.date, views: d.views };
    });

    // Create path
    const pathData = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, '');

    // Y-axis labels
    const yLabels = [0, Math.round(maxViews / 2), maxViews];

    // X-axis labels (show first, middle, last)
    const xLabels = [
      { index: 0, label: formatChartDate(data[0].date) },
      { index: Math.floor(data.length / 2), label: formatChartDate(data[Math.floor(data.length / 2)].date) },
      { index: data.length - 1, label: formatChartDate(data[data.length - 1].date) },
    ];

    return (
      <Svg width={SCREEN_WIDTH - theme.spacing.lg * 2} height={CHART_HEIGHT}>
        {/* Grid lines */}
        {yLabels.map((label, i) => {
          const y = CHART_PADDING.top + chartHeight - (i / 2) * chartHeight;
          return (
            <Line
              key={`grid-${i}`}
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_PADDING.left + chartWidth}
              y2={y}
              stroke={theme.colors.border}
              strokeDasharray="3,3"
            />
          );
        })}

        {/* Y-axis labels */}
        {yLabels.map((label, i) => {
          const y = CHART_PADDING.top + chartHeight - (i / 2) * chartHeight;
          return (
            <SvgText
              key={`y-label-${i}`}
              x={CHART_PADDING.left - 8}
              y={y + 4}
              fontSize={10}
              fill={theme.colors.textSecondary}
              textAnchor="end"
            >
              {label}
            </SvgText>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map(({ index, label }) => {
          const x = CHART_PADDING.left + (index / (data.length - 1 || 1)) * chartWidth;
          return (
            <SvgText
              key={`x-label-${index}`}
              x={x}
              y={CHART_HEIGHT - 8}
              fontSize={10}
              fill={theme.colors.textSecondary}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Line */}
        <Path d={pathData} stroke={theme.colors.primary} strokeWidth={2} fill="none" />

        {/* Points */}
        {points.map((point, i) => (
          <Circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={theme.colors.primary}
          />
        ))}
      </Svg>
    );
  };

  // Not authenticated or no access
  if (!isAuthenticated || !hasAnalyticsAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <BarChart3 size={64} color={theme.colors.textMuted} strokeWidth={1} />
          <Text variant="h4" color="secondary" style={styles.emptyTitle}>
            غير متاح
          </Text>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.emptyButton}
          >
            العودة
          </Button>
        </View>
      </View>
    );
  }

  // Loading state (initial load)
  if (isLoading && !listingAnalytics) {
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
  if (error && !listingAnalytics) {
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
              if (listingId) fetchListingAnalytics(listingId, dateRange);
            }}
            style={styles.emptyButton}
          >
            إعادة المحاولة
          </Button>
        </View>
      </View>
    );
  }

  // No data state
  if (!listingAnalytics) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <BarChart3 size={64} color={theme.colors.textMuted} strokeWidth={1} />
          <Text variant="h4" color="secondary" style={styles.emptyTitle}>
            لا توجد بيانات
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
                color={dateRange === option.value ? 'light' : 'secondary'}
                style={dateRange === option.value ? styles.dateRangeTextActive : undefined}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsSection}>
        <Text variant="h4" style={styles.sectionTitle}>
          الإحصائيات
        </Text>

        <View style={styles.statsGrid}>
          {/* Views */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Eye size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text variant="h3">{formatNumber(listingAnalytics.viewCount)}</Text>
              <Text variant="xs" color="secondary">
                المشاهدات
              </Text>
              {listingAnalytics.viewsToday > 0 && (
                <Text variant="xs" color="success">
                  +{formatNumber(listingAnalytics.viewsToday)} اليوم
                </Text>
              )}
            </View>
          </View>

          {/* Wishlists */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Heart size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text variant="h3">{formatNumber(listingAnalytics.wishlistCount)}</Text>
              <Text variant="xs" color="secondary">
                المفضلة
              </Text>
            </View>
          </View>

          {/* Days on Market */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Calendar size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text variant="h3">{formatNumber(listingAnalytics.daysOnMarket)}</Text>
              <Text variant="xs" color="secondary">
                أيام في السوق
              </Text>
            </View>
          </View>

          {/* Engagement Rate */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Activity size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text variant="h3">{listingAnalytics.engagementRate.toFixed(1)}%</Text>
              <Text variant="xs" color="secondary">
                معدل التفاعل
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Performance Indicator */}
      {listingAnalytics.performanceIndicator && (
        <View style={styles.performanceSection}>
          <View style={styles.performanceHeader}>
            <TrendingUp size={20} color={theme.colors.primary} />
            <Text variant="h4" style={styles.performanceTitle}>
              مؤشر الأداء
            </Text>
            <View
              style={[
                styles.performanceBadge,
                { backgroundColor: getPerformanceColor(listingAnalytics.performanceIndicator) },
              ]}
            >
              <Text variant="xs" style={styles.performanceBadgeText}>
                {getPerformanceLabel(listingAnalytics.performanceIndicator)}
              </Text>
            </View>
          </View>

          {/* Performance Bar */}
          <View style={styles.performanceBarContainer}>
            <View style={styles.performanceBar}>
              <View style={[styles.performanceSegment, { backgroundColor: theme.colors.error, flex: 1 }]} />
              <View style={[styles.performanceSegment, { backgroundColor: theme.colors.warning, flex: 1 }]} />
              <View style={[styles.performanceSegment, { backgroundColor: theme.colors.info, flex: 1 }]} />
              <View style={[styles.performanceSegment, { backgroundColor: theme.colors.success, flex: 1 }]} />
            </View>
            <View
              style={[
                styles.performanceMarker,
                {
                  left: `${getMarkerPosition(listingAnalytics.performanceIndicator) * 100}%`,
                },
              ]}
            />
          </View>

          <View style={styles.performanceScale}>
            <Text variant="xs" color="error">ضعيف جداً</Text>
            <Text variant="xs" color="warning">ضعيف</Text>
            <Text variant="xs" color="info">جيد</Text>
            <Text variant="xs" color="success">ممتاز</Text>
          </View>
        </View>
      )}

      {/* Comparison Text */}
      {listingAnalytics.comparisonText && (
        <View style={styles.comparisonCard}>
          <Text variant="paragraph" color="secondary">
            {listingAnalytics.comparisonText}
          </Text>
        </View>
      )}

      {/* Views Chart */}
      <View style={styles.chartSection}>
        <Text variant="h4" style={styles.sectionTitle}>
          المشاهدات عبر الوقت
        </Text>
        {renderLineChart()}
      </View>
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
    dateRangeContainer: {
      backgroundColor: theme.colors.bg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dateRangeScroll: {
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
      flexDirection: 'row',
    },
    dateRangeButton: {
      paddingHorizontal: theme.spacing.md,
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
      alignItems: 'center',
    },
    performanceSection: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    performanceHeader: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    performanceTitle: {
      flex: 1,
    },
    performanceBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
    },
    performanceBadgeText: {
      color: '#fff',
      fontWeight: '600',
    },
    performanceBarContainer: {
      position: 'relative',
      marginBottom: theme.spacing.sm,
    },
    performanceBar: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    performanceSegment: {
      height: '100%',
    },
    performanceMarker: {
      position: 'absolute',
      top: -4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.text,
      marginLeft: -8,
      borderWidth: 2,
      borderColor: theme.colors.bg,
    },
    performanceScale: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
    },
    comparisonCard: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chartSection: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chartPlaceholder: {
      height: CHART_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chartPlaceholderText: {
      marginTop: theme.spacing.sm,
    },
  });
