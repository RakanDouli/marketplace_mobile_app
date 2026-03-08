/**
 * Category Selection Screen
 * - If category is a collection: show child categories
 * - If category supports both types: show buy/sell options
 * - If category supports one type: redirect to listings
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Key, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, Theme } from '../../../../src/theme';
import { Text, Loading, ListItem } from '../../../../src/components/slices';
import { useCategoriesStore } from '../../../../src/stores/categoriesStore';

/**
 * Renders category icon from SVG string
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

export default function CategorySelectionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { categorySlug, search: searchParam } = useLocalSearchParams<{ categorySlug: string; search?: string }>();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Stores
  const { getCategoryBySlug, fetchCategories, categories, isLoading } = useCategoriesStore();

  // Fetch categories if not loaded
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  // Get category info
  const category = getCategoryBySlug(categorySlug || '');
  const isCollection = category?.isCollection || false;
  const supportedTypes = category?.supportedListingTypes || ['sale'];
  const supportsBothTypes = supportedTypes.length === 2;

  // Get child categories if this is a collection
  const childCategories = useMemo(() => {
    if (!isCollection || !category) return [];
    return categories.filter(cat => cat.parentCollectionId === category.id && cat.isActive);
  }, [categories, category, isCollection]);

  // Build URL with search param if present
  const buildUrl = (slug: string, type?: string) => {
    const base = type ? `/search/${slug}/${type}` : `/search/${slug}`;
    if (searchParam) {
      return `${base}?search=${encodeURIComponent(searchParam)}`;
    }
    return base;
  };

  // If category is NOT a collection and only supports one type, navigate directly to listings
  useEffect(() => {
    if (category && !isCollection && !supportsBothTypes) {
      router.replace(buildUrl(categorySlug || '', supportedTypes[0]));
    }
  }, [category, isCollection, supportsBothTypes, searchParam]);

  const handleTypePress = (type: 'sale' | 'rent') => {
    router.push(buildUrl(categorySlug || '', type));
  };

  const handleChildCategoryPress = (childSlug: string) => {
    router.push(buildUrl(childSlug));
  };

  // Loading state
  if (isLoading || !category) {
    return (
      <>
        <Stack.Screen options={{ title: 'جاري التحميل...' }} />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="lg" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // If NOT a collection and only supports one type, show loading while redirecting
  if (!isCollection && !supportsBothTypes) {
    return (
      <>
        <Stack.Screen options={{ title: category.nameAr }} />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="lg" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // If this is a collection, show child categories
  if (isCollection) {
    return (
      <>
        <Stack.Screen
          options={{
            title: category.nameAr,
            headerBackTitle: 'الأقسام',
          }}
        />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          {/* Child Categories List */}
          <ScrollView style={styles.childCategoriesList} contentContainerStyle={styles.childCategoriesContent}>
            {childCategories.map((child, index) => (
              <ListItem
                key={child.id}
                label={child.nameAr || child.name}
                icon={renderCategoryIcon(child.icon, 24, theme.colors.primary)}
                onPress={() => handleChildCategoryPress(child.slug)}
                showArrow
                showBorder={index < childCategories.length - 1}
                size="lg"
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: category.nameAr,
          headerBackTitle: 'الأقسام',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h2" style={styles.headerTitle}>
              ماذا تريد أن تفعل؟
            </Text>
            <Text variant="paragraph" color="secondary" style={styles.headerSubtitle}>
              اختر نوع الإعلانات التي تريد تصفحها في {category.nameAr}
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Sale Option */}
            <TouchableOpacity
              style={[styles.optionCard, theme.rtl.flexDirection.row()]}
              onPress={() => handleTypePress('sale')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <ShoppingBag size={40} color={theme.colors.primary} />
              </View>
              <View style={[styles.optionContent, { alignItems: theme.isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text variant="h3" style={styles.optionTitle}>
                  للبيع
                </Text>
                <Text variant="paragraph" color="secondary" style={styles.optionDescription}>
                  تصفح {category.nameAr} المعروضة للبيع
                </Text>
              </View>
              {theme.isRTL ? (
                <ChevronLeft size={24} color={theme.colors.textMuted} />
              ) : (
                <ChevronRight size={24} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>

            {/* Rent Option */}
            <TouchableOpacity
              style={[styles.optionCard, theme.rtl.flexDirection.row()]}
              onPress={() => handleTypePress('rent')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.successLight || '#E8F5E9' }]}>
                <Key size={40} color={theme.colors.success} />
              </View>
              <View style={[styles.optionContent, { alignItems: theme.isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text variant="h3" style={styles.optionTitle}>
                  للإيجار
                </Text>
                <Text variant="paragraph" color="secondary" style={styles.optionDescription}>
                  تصفح {category.nameAr} المعروضة للإيجار
                </Text>
              </View>
              {theme.isRTL ? (
                <ChevronLeft size={24} color={theme.colors.textMuted} />
              ) : (
                <ChevronRight size={24} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    headerTitle: {
      marginBottom: theme.spacing.sm,
    },
    headerSubtitle: {
    },
    childCategoriesList: {
      flex: 1,
    },
    childCategoriesContent: {
      paddingBottom: 120, // Extra padding to account for tab bar
    },
    optionsContainer: {
      gap: theme.spacing.md,
    },
    optionCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.bg,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    optionIcon: {
      width: 72,
      height: 72,
      borderRadius: theme.radius.xl,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      marginBottom: theme.spacing.xs,
    },
    optionDescription: {
    },
  });
