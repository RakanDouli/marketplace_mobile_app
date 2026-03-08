/**
 * Create Listing - Collection Children Selection
 * Shows child categories of a collection (e.g., Electronics -> Phones, Tablets, Computers)
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LayoutGrid, ChevronLeft } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, Theme } from '../../src/theme';
import { Text, ListItem, Button } from '../../src/components/slices';
import { useCategoriesStore, type Category } from '../../src/stores/categoriesStore';
import { useCreateListingStore } from '../../src/stores/createListingStore';

/**
 * Renders category icon from SVG string (from backend)
 */
function renderCategoryIcon(iconSvg: string | undefined, size: number, color: string) {
  if (!iconSvg) return <LayoutGrid size={size} color={color} />;

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

export default function CollectionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ collectionId: string; collectionName: string }>();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { collectionId, collectionName } = params;

  // Categories store
  const { categories, isLoading, isInitialized, fetchCategories } = useCategoriesStore();

  // Create listing store
  const { setCategory } = useCreateListingStore();

  // Fetch categories on mount if not already loaded
  useEffect(() => {
    if (!isInitialized) {
      fetchCategories();
    }
  }, [isInitialized, fetchCategories]);

  // Filter child categories of this collection
  const childCategories = useMemo(() => {
    if (!collectionId) {
      console.log('[Collection] No collectionId in params');
      return [];
    }
    console.log('[Collection] collectionId:', collectionId);
    console.log('[Collection] Total categories:', categories.length);
    console.log('[Collection] Categories with parentCollectionId:', categories.filter(cat => cat.parentCollectionId).map(cat => ({ name: cat.nameAr, parentCollectionId: cat.parentCollectionId })));
    const filtered = categories.filter(cat => cat.parentCollectionId === collectionId && cat.isActive);
    console.log('[Collection] Filtered childCategories:', filtered.length);
    return filtered;
  }, [categories, collectionId]);

  // Show loading if categories are loading OR not yet initialized
  const showLoading = isLoading || !isInitialized;

  const handleCategorySelect = async (category: Category) => {
    // Set category in create listing store (this fetches attributes & brands)
    await setCategory(category.id);

    // If category only supports one listing type, set it automatically
    if (category.supportedListingTypes.length === 1) {
      useCreateListingStore.getState().setFormField('listingType', category.supportedListingTypes[0]);
    }

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
    <>
      <Stack.Screen
        options={{
          title: collectionName || 'اختر الفئة',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <ChevronLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Loading State */}
        {showLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="paragraph" color="secondary" style={styles.loadingText}>
              جاري تحميل الفئات...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!showLoading && childCategories.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text variant="paragraph" color="secondary">
              لا توجد فئات فرعية
            </Text>
          </View>
        )}

        {/* Child Categories List */}
        {!showLoading && childCategories.length > 0 && (
          <ScrollView style={styles.categories} contentContainerStyle={styles.categoriesContent}>
            {childCategories.map((category, index) => (
              <ListItem
                key={category.id}
                label={category.nameAr || category.name}
                icon={renderCategoryIcon(category.icon, 24, theme.colors.primary)}
                onPress={() => handleCategorySelect(category)}
                showArrow
                showBorder={index < childCategories.length - 1}
                size="lg"
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    categories: {
      flex: 1,
    },
    categoriesContent: {
      paddingBottom: 120, // Extra padding to account for tab bar
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
  });
