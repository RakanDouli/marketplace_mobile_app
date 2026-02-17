/**
 * Listing Type Selection Screen
 * Shows buy/sell options for a category before showing listings
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Key, ChevronLeft } from 'lucide-react-native';
import { useTheme, Theme } from '../../../../src/theme';
import { Text, Loading } from '../../../../src/components/ui';
import { useCategoriesStore } from '../../../../src/stores/categoriesStore';

export default function ListingTypeSelectionScreen() {
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
  const supportedTypes = category?.supportedListingTypes || ['sale'];
  const supportsBothTypes = supportedTypes.length === 2;

  // Build URL with search param if present
  const buildUrl = (type: string) => {
    const base = `/search/${categorySlug}/${type}`;
    if (searchParam) {
      return `${base}?search=${encodeURIComponent(searchParam)}`;
    }
    return base;
  };

  // If category only supports one type, navigate directly to listings
  useEffect(() => {
    if (category && !supportsBothTypes) {
      router.replace(buildUrl(supportedTypes[0]));
    }
  }, [category, supportsBothTypes, searchParam]);

  const handleTypePress = (type: 'sale' | 'rent') => {
    router.push(buildUrl(type));
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

  // If only supports one type, show loading while redirecting
  if (!supportsBothTypes) {
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
              style={styles.optionCard}
              onPress={() => handleTypePress('sale')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <ShoppingBag size={40} color={theme.colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text variant="h3" style={styles.optionTitle}>
                  للبيع
                </Text>
                <Text variant="paragraph" color="secondary" style={styles.optionDescription}>
                  تصفح {category.nameAr} المعروضة للبيع
                </Text>
              </View>
              <ChevronLeft size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>

            {/* Rent Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleTypePress('rent')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.successLight || '#E8F5E9' }]}>
                <Key size={40} color={theme.colors.success} />
              </View>
              <View style={styles.optionContent}>
                <Text variant="h3" style={styles.optionTitle}>
                  للإيجار
                </Text>
                <Text variant="paragraph" color="secondary" style={styles.optionDescription}>
                  تصفح {category.nameAr} المعروضة للإيجار
                </Text>
              </View>
              <ChevronLeft size={24} color={theme.colors.textMuted} />
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
      textAlign: 'right',
      marginBottom: theme.spacing.sm,
    },
    headerSubtitle: {
      textAlign: 'right',
    },
    optionsContainer: {
      gap: theme.spacing.md,
    },
    optionCard: {
      flexDirection: 'row-reverse',
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
      alignItems: 'flex-end',
    },
    optionTitle: {
      marginBottom: theme.spacing.xs,
    },
    optionDescription: {
      textAlign: 'right',
    },
  });
