/**
 * Create Listing - Select Category
 * Shows top-level categories and collections (no child categories)
 * - Collections navigate to /create/collection to show children
 * - Regular categories navigate to brand/wizard flow
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LayoutGrid } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../src/theme';
import { Text, ListItem, Button } from '../../src/components/slices';
import { useCategoriesStore, type Category } from '../../src/stores/categoriesStore';
import { useCreateListingStore } from '../../src/stores/createListingStore';

/**
 * Renders category icon from SVG string (from backend)
 * Falls back to LayoutGrid if no icon or parse error
 */
function renderCategoryIcon(iconSvg: string | undefined, size: number, color: string) {
  if (!iconSvg) return <LayoutGrid size={size} color={color} />;

  // Style the SVG with correct size and color
  // Replace currentColor with the actual color (same pattern as CategoryCard)
  const styledSvg = iconSvg
    .replace(/<svg/, `<svg width="${size}" height="${size}"`)
    .replace(/stroke="currentColor"/g, `stroke="${color}"`)
    .replace(/fill="currentColor"/g, `fill="${color}"`);

  try {
    return <SvgXml xml={styledSvg} width={size} height={size} />;
  } catch {
    return <LayoutGrid size={size} color={color} />;
  }
}

export default function CreateListingScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Categories store
  const { categories, isLoading, error, fetchCategories } = useCategoriesStore();

  // Create listing store
  const { setCategory, reset } = useCreateListingStore();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset wizard state when this screen loads
  useEffect(() => {
    reset();
  }, []);

  // Filter to show only top-level categories (no parentCollectionId)
  // This includes standalone categories AND collections
  const topLevelCategories = useMemo(() => {
    return categories.filter(cat => !cat.parentCollectionId && cat.isActive);
  }, [categories]);

  const handleCategorySelect = async (category: Category) => {
    // If this is a collection, navigate to collection children page
    if (category.isCollection) {
      console.log('[Create] Navigating to collection:', category.id, category.nameAr);
      router.push({
        pathname: '/create/collection' as const,
        params: {
          collectionId: category.id,
          collectionName: category.nameAr || category.name,
        },
      });
      return;
    }

    // Set category in create listing store (this fetches attributes & brands)
    await setCategory(category.id);

    // If category only supports one listing type, set it automatically
    if (category.supportedListingTypes.length === 1) {
      useCreateListingStore.getState().setFormField('listingType', category.supportedListingTypes[0]);
    }
    // Note: If multiple types supported, user will select in BasicInfoStep

    // Check if category has brands (pre-step flow)
    const store = useCreateListingStore.getState();
    const hasBrands = store.attributes.some(attr => attr.key === 'brandId');

    if (hasBrands && store.brands.length > 0) {
      // Go to brand selection pre-step
      router.push('/create/brand');
    } else {
      // No brands for this category, go directly to wizard
      router.push('/create/wizard');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.bg, borderBottomColor: theme.colors.border }]}>
        <Text variant="h2">إضافة إعلان</Text>
        <Text variant="paragraph" color="secondary">اختر الفئة</Text>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            جاري تحميل الفئات...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text variant="paragraph" color="error">
            {error}
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={() => fetchCategories()}
            style={styles.retryButton}
          >
            إعادة المحاولة
          </Button>
        </View>
      )}

      {/* Categories - Using ListItem slice */}
      {!isLoading && !error && (
        <ScrollView style={styles.categories} contentContainerStyle={styles.categoriesContent}>
          {topLevelCategories.map((category, index) => (
            <ListItem
              key={category.id}
              label={category.nameAr || category.name}
              icon={renderCategoryIcon(category.icon, 24, theme.colors.primary)}
              onPress={() => handleCategorySelect(category)}
              showArrow
              showBorder={index < topLevelCategories.length - 1}
              size="lg"
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categories: {
    flex: 1,
  },
  categoriesContent: {
    paddingBottom: 100, // Account for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 16,
  },
});
