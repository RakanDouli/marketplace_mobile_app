/**
 * Search Screen - Categories Selection
 * Shows all categories in a grid, tapping navigates to category listings
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { LayoutGrid, Package } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text, Loading, SearchBar } from '../../../src/components/ui';
import { useCategoriesStore } from '../../../src/stores/categoriesStore';

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 600;
  const isDesktop = screenWidth >= 900;

  const {
    categories,
    isLoading,
    fetchCategories,
  } = useCategoriesStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const activeCategories = useMemo(() => categories.filter(cat => cat.isActive), [categories]);

  const styles = useMemo(() => createStyles(theme, screenWidth, isTablet, isDesktop), [theme, screenWidth, isTablet, isDesktop]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryPress = (slug: string) => {
    router.push(`/search/${slug}`);
  };

  const handleSearch = () => {
    if (!selectedCategory) {
      // SearchBar component will handle showing dropdown
      return;
    }
    // Pass search term via URL params (like web frontend)
    // Go to category page first - it will handle sale/rent selection if needed
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    const queryString = params.toString();
    const url = queryString
      ? `/search/${selectedCategory}?${queryString}`
      : `/search/${selectedCategory}`;
    router.push(url);
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    // Auto-navigate if search text exists
    if (searchTerm.trim()) {
      router.push(`/search/${slug}?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Helper to render category icon from SVG string
  const renderCategoryIcon = (iconSvg: string | undefined, size: number, color: string) => {
    if (!iconSvg) return <LayoutGrid size={size} color={color} />;
    const styledSvg = iconSvg
      .replace(/<svg/, `<svg width="${size}" height="${size}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
      .replace(/fill="[^"]*"/g, 'fill="none"');
    try { return <SvgXml xml={styledSvg} width={size} height={size} />; }
    catch { return <LayoutGrid size={size} color={color} />; }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChangeText={setSearchTerm}
        onSubmitEditing={handleSearch}
        categories={activeCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchCategories}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text variant="h4" style={styles.sectionTitle}>
            جميع الأقسام
          </Text>
        </View>

        {/* Categories Grid - Icons only, no background images */}
        {isLoading && categories.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="lg" />
            <Text variant="small" color="muted" style={{ marginTop: 12 }}>
              جاري تحميل الأقسام...
            </Text>
          </View>
        ) : categories.length > 0 ? (
          <View style={styles.categoriesGrid}>
            {activeCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.slug)}
                activeOpacity={0.8}
              >
                <View style={styles.categoryCardIcon}>
                  {renderCategoryIcon(category.icon, 32, theme.colors.primary)}
                </View>
                <Text variant="h4">{category.nameAr}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Package size={64} color={theme.colors.textMuted} strokeWidth={1} />
            <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
              لا توجد أقسام متاحة
            </Text>
            <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
              يرجى المحاولة لاحقاً
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>, screenWidth: number, isTablet: boolean, isDesktop: boolean) => {
  const horizontalPadding = isDesktop ? theme.spacing.md * 3 : isTablet ? theme.spacing.md * 2 : theme.spacing.md;
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const gridGap = theme.spacing.md;
  const cardWidth = (screenWidth - horizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingBottom: 40,
    },
    sectionHeader: {
      paddingHorizontal: horizontalPadding,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    sectionTitle: {
      textAlign: 'right',
    },
    loadingContainer: {
      padding: 60,
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
    },
    categoriesGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      paddingHorizontal: horizontalPadding,
      gap: gridGap,
    },
    categoryCard: {
      width: cardWidth,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.bg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      minHeight: 120,
      gap: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    categoryCardIcon: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
