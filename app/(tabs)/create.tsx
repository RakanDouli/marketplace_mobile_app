/**
 * Create Listing - Select Category
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Car,
  Smartphone,
  Home,
  ShoppingBag,
  ChevronLeft,
  Laptop,
  Shirt,
  Sofa,
  Wrench,
  Package,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/slices/Text';
import { useCategoriesStore, type Category } from '../../src/stores/categoriesStore';
import { useCreateListingStore } from '../../src/stores/createListingStore';

// Map category slugs/icons to Lucide icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cars: Car,
  electronics: Smartphone,
  'real-estate': Home,
  phones: Smartphone,
  laptops: Laptop,
  clothing: Shirt,
  furniture: Sofa,
  services: Wrench,
  other: ShoppingBag,
};

// Fallback icon mapping by icon name from backend
const ICON_NAME_MAP: Record<string, LucideIcon> = {
  car: Car,
  smartphone: Smartphone,
  home: Home,
  laptop: Laptop,
  shirt: Shirt,
  sofa: Sofa,
  wrench: Wrench,
  package: Package,
  'shopping-bag': ShoppingBag,
};

function getCategoryIcon(category: Category): LucideIcon {
  // Try by slug first
  if (CATEGORY_ICONS[category.slug]) {
    return CATEGORY_ICONS[category.slug];
  }
  // Try by icon name from backend
  if (category.icon && ICON_NAME_MAP[category.icon.toLowerCase()]) {
    return ICON_NAME_MAP[category.icon.toLowerCase()];
  }
  // Default fallback
  return Package;
}

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

function CategoryCard({ category, onPress }: CategoryCardProps) {
  const theme = useTheme();
  const IconComponent = getCategoryIcon(category);

  return (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* RTL: Chevron on left, content on right */}
      <ChevronLeft size={20} color={theme.colors.textMuted} />
      <View style={styles.categoryContent}>
        <Text variant="body">{category.nameAr || category.name}</Text>
        <IconComponent size={32} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );
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

  const handleCategorySelect = async (category: Category) => {
    // Set category in create listing store
    await setCategory(category.id);

    // Check if category supports multiple listing types (sale/rent)
    if (category.supportedListingTypes.length > 1) {
      // Navigate to listing type selection
      router.push({
        pathname: '/create/listing-type',
        params: { categoryId: category.id, categoryName: category.nameAr || category.name },
      });
    } else {
      // Skip listing type selection, go directly to wizard
      // Set the only supported listing type
      useCreateListingStore.getState().setFormField('listingType', category.supportedListingTypes[0]);
      router.push({
        pathname: '/create/wizard',
        params: { categoryId: category.id },
      });
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
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => fetchCategories()}
          >
            <Text variant="body" color="inverse">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categories */}
      {!isLoading && !error && (
        <ScrollView style={styles.categories} contentContainerStyle={styles.categoriesContent}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => handleCategorySelect(category)}
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
    padding: 16,
    paddingBottom: 100, // Account for tab bar
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryContent: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end', // RTL: content aligned to right
    gap: 12,
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
