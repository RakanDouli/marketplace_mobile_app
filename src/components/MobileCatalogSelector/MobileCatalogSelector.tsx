/**
 * MobileCatalogSelector - Step-by-step Brand → Model → Variant selector
 * Used for browsing/filtering listings on category pages
 *
 * Uses ListItem component for consistent navigation items
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Theme } from '../../theme';
import { Text, Loading, ListItem } from '../slices';

// ============ TYPES ============

export interface CatalogOption {
  id: string;
  name: string;
  count?: number;
  /** Model name for grouping variants */
  modelName?: string;
  /** Model ID for variants */
  modelId?: string;
  /** Arabic name for brands */
  nameAr?: string;
  /** Logo URL for brands */
  logoUrl?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  count?: number;
}

export interface MobileCatalogSelectorProps {
  /** Current step: 'brand' or 'variant' */
  step: 'brand' | 'variant';
  /** Category slug for URL building */
  categorySlug: string;
  /** Listing type: 'sell' or 'rent' */
  listingType: string;
  /** Category name in Arabic for display */
  categoryNameAr: string;
  /** List of options (brands or variants) */
  options: CatalogOption[];
  /** List of models (for showing models without variants) */
  modelOptions?: ModelOption[];
  /** Currently selected brand ID (when on variant step) */
  selectedBrandId?: string;
  /** Currently selected brand name (when on variant step) */
  selectedBrandName?: string;
  /** Total count for "Show All" option */
  totalCount?: number;
  /** Whether options are loading */
  isLoading?: boolean;
  /** Callback when back button pressed */
  onBack?: () => void;
}

// ============ COMPONENT ============

export const MobileCatalogSelector: React.FC<MobileCatalogSelectorProps> = ({
  step,
  categorySlug,
  listingType,
  categoryNameAr,
  options,
  modelOptions = [],
  selectedBrandId,
  selectedBrandName,
  totalCount,
  isLoading = false,
  onBack,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Process options for variant step (group variants by model)
  const processedDisplay = useMemo(() => {
    if (step !== 'variant') return null;

    // Find models without variants
    const modelsWithoutVariants = modelOptions.filter((model) => {
      const hasVariants = options.some(
        (opt) => opt.modelId === model.id || opt.modelName === model.name
      );
      return !hasVariants;
    });

    // Group variants by model name
    const variantGroups: Record<string, CatalogOption[]> = {};
    options.forEach((opt) => {
      const modelName = opt.modelName || 'أخرى';
      if (!variantGroups[modelName]) {
        variantGroups[modelName] = [];
      }
      variantGroups[modelName].push(opt);
    });

    // Sort model names alphabetically
    const sortedModelNames = Object.keys(variantGroups).sort();
    const groups = sortedModelNames.map((modelName) => ({
      modelName,
      variants: variantGroups[modelName],
    }));

    // Sort standalone models
    const standaloneModels = modelsWithoutVariants.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return { groups, standaloneModels };
  }, [step, options, modelOptions]);

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (step === 'variant' && selectedBrandId) {
      // Go back to brand selection
      router.push(`/search/${categorySlug}/${listingType}`);
    } else {
      router.back();
    }
  };

  // Handle "Show All" - skip selection, show all listings
  const handleShowAll = () => {
    if (step === 'brand') {
      router.push({
        pathname: `/search/${categorySlug}/${listingType}`,
        params: { showListings: 'true' },
      });
    } else {
      router.push({
        pathname: `/search/${categorySlug}/${listingType}`,
        params: { brandId: selectedBrandId, showListings: 'true' },
      });
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: CatalogOption) => {
    if (step === 'brand') {
      // Navigate to variant selection for this brand
      router.push({
        pathname: `/search/${categorySlug}/${listingType}`,
        params: { brandId: option.id },
      });
    } else {
      // Navigate to listings with brand + variant/model filter
      router.push({
        pathname: `/search/${categorySlug}/${listingType}`,
        params: { brandId: selectedBrandId, variantId: option.id, showListings: 'true' },
      });
    }
  };

  // Handle model selection (for models without variants)
  const handleModelSelect = (model: ModelOption) => {
    router.push({
      pathname: `/search/${categorySlug}/${listingType}`,
      params: { brandId: selectedBrandId, modelId: model.id, showListings: 'true' },
    });
  };

  // Render count badge as endContent
  const renderCountBadge = (count?: number) => {
    if (count === undefined) return undefined;
    return (
      <Text variant="small" color="secondary" style={styles.countBadge}>
        {count}
      </Text>
    );
  };

  // Render brand icon with logo (or undefined if no logo)
  const renderBrandIcon = (option: CatalogOption) => {
    if (option.logoUrl) {
      return (
        <View style={styles.brandLogoContainer}>
          <Image
            source={{ uri: option.logoUrl }}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>
      );
    }
    return undefined;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loading type="svg" size="lg" />
          <Text variant="body" color="secondary" style={{ marginTop: theme.spacing.md }}>
            جاري التحميل...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Show All Button - highlighted primary item */}
        <ListItem
          label={step === 'brand' ? 'عرض كل الإعلانات' : `عرض كل طرازات ${selectedBrandName}`}
          onPress={handleShowAll}
          endContent={renderCountBadge(totalCount)}
          style={styles.showAllItem}
          showBorder={true}
        />

        {/* Divider */}
        <View style={styles.sectionDivider}>
          <Text variant="small" color="secondary">
            {step === 'brand' ? 'أو اختر ماركة' : 'أو اختر طراز'}
          </Text>
        </View>

        {step === 'variant' && processedDisplay ? (
          // Variant step: grouped variants + standalone models
          <>
            {/* Groups (models with variants) */}
            {processedDisplay.groups.map((group) => (
              <View key={group.modelName}>
                {/* Model Section Header */}
                <View style={styles.sectionHeader}>
                  <Text variant="h4" style={styles.sectionHeaderText}>
                    {group.modelName}
                  </Text>
                </View>

                {/* Variants under this model */}
                {group.variants.map((option, index) => (
                  <ListItem
                    key={option.id}
                    label={option.name}
                    onPress={() => handleOptionSelect(option)}
                    endContent={renderCountBadge(option.count)}
                    showBorder={index < group.variants.length - 1}
                  />
                ))}
              </View>
            ))}

            {/* Standalone models (models without variants) */}
            {processedDisplay.standaloneModels.length > 0 && (
              <View>
                {/* Divider between groups and standalone models */}
                {processedDisplay.groups.length > 0 && (
                  <View style={styles.sectionDivider}>
                    <Text variant="small" color="secondary">موديلات أخرى</Text>
                  </View>
                )}
                {processedDisplay.standaloneModels.map((model, index) => (
                  <ListItem
                    key={model.id}
                    label={model.name}
                    onPress={() => handleModelSelect(model)}
                    endContent={renderCountBadge(model.count)}
                    showBorder={index < processedDisplay.standaloneModels.length - 1}
                  />
                ))}
              </View>
            )}

            {/* Empty state */}
            {options.length === 0 && processedDisplay.standaloneModels.length === 0 && (
              <View style={styles.emptyState}>
                <Text variant="body" color="secondary">
                  لا توجد طرازات متاحة
                </Text>
              </View>
            )}
          </>
        ) : (
          // Brand step: flat list with logos
          <>
            {options.map((option, index) => (
              <ListItem
                key={option.id}
                label={option.nameAr || option.name}
                subtitle={option.nameAr && option.nameAr !== option.name ? option.name : undefined}
                icon={renderBrandIcon(option)}
                onPress={() => handleOptionSelect(option)}
                endContent={renderCountBadge(option.count)}
                showBorder={index < options.length - 1}
              />
            ))}

            {/* Empty state */}
            {options.length === 0 && (
              <View style={styles.emptyState}>
                <Text variant="body" color="secondary">
                  لا توجد ماركات متاحة
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ============ STYLES ============

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Show All button (highlighted item at top)
    showAllItem: {
      backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}10`,
    },

    // Section divider (between show all and options)
    sectionDivider: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      backgroundColor: theme.colors.bg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },

    // Section headers (for grouped variants by model)
    sectionHeader: {
      backgroundColor: theme.colors.surface,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionHeaderText: {
      fontWeight: '600',
      color: theme.colors.text,
    },

    // Brand logo container
    brandLogoContainer: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    brandLogo: {
      width: 32,
      height: 32,
    },

    // Count badge
    countBadge: {
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },

    // Empty state
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
    },
  });

export default MobileCatalogSelector;
