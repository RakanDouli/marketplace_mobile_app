/**
 * Filters Screen
 * Full-screen filter selection with drill-down navigation
 * Implements cascading filters (brand → model dependency)
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ChevronLeft,
  X,
  Trash2,
  Check,
} from 'lucide-react-native';
import { useTheme, Theme } from '../../../../src/theme';
import { Text, Loading, IconGridSelector } from '../../../../src/components/ui';
import {
  useFiltersStore,
  type ActiveFilter,
} from '../../../../src/stores/filtersStore';

export default function FiltersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { categorySlug, listingType, filters: filtersParam } = useLocalSearchParams<{
    categorySlug: string;
    listingType: string;
    filters?: string;
  }>();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Store - use shared appliedFilters state
  const {
    attributes,
    totalResults,
    isLoading,
    fetchFilterData,
    updateFiltersWithCascading,
    appliedFilters,
    setAppliedFilters,
    clearFilters: storeClearFilters,
  } = useFiltersStore();

  // Track our own loading state for cascading updates (non-blocking)
  const [isUpdatingCounts, setIsUpdatingCounts] = useState(false);

  // State
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize filters from URL params if present - sync to shared store
  useEffect(() => {
    if (filtersParam && !isInitialized) {
      try {
        const parsed = JSON.parse(decodeURIComponent(filtersParam));
        // Handle both array and object formats
        if (Array.isArray(parsed)) {
          const fullFilters: ActiveFilter[] = parsed.map((f: { key: string; value: string; label?: string; valueLabel?: string }) => ({
            key: f.key,
            label: f.label || f.key,
            value: f.value,
            valueLabel: f.valueLabel || f.value,
          }));
          setAppliedFilters(fullFilters);
        } else if (typeof parsed === 'object' && parsed !== null) {
          const filtersArray: ActiveFilter[] = Object.entries(parsed)
            .filter(([, value]) => value !== undefined && value !== '')
            .map(([key, value]) => ({
              key,
              label: key,
              value: String(value),
              valueLabel: String(value),
            }));
          setAppliedFilters(filtersArray);
        }
        setIsInitialized(true);
      } catch {
        setIsInitialized(true);
      }
    } else if (!filtersParam) {
      setIsInitialized(true);
    }
  }, [filtersParam, isInitialized, setAppliedFilters]);

  // Fetch filter data when screen mounts
  useEffect(() => {
    if (categorySlug) {
      fetchFilterData(categorySlug, listingType);
    }
  }, [categorySlug, listingType]);

  // Helper to get label from attributes (no state update needed)
  const getFilterLabel = useCallback((key: string, value: string): { label: string; valueLabel: string } => {
    const attr = attributes.find(a => a.key === key);
    if (attr) {
      const option = attr.processedOptions.find(o => o.key === value);
      return {
        label: attr.name,
        valueLabel: option?.value || value,
      };
    }
    return { label: key, valueLabel: value };
  }, [attributes]);

  // Update cascading counts when filters change
  useEffect(() => {
    if (categorySlug && listingType && isInitialized && appliedFilters.length > 0) {
      const filtersMap: Record<string, string> = {};
      appliedFilters.forEach(f => {
        filtersMap[f.key] = f.value;
      });
      // Run in background, don't block UI
      setIsUpdatingCounts(true);
      updateFiltersWithCascading(categorySlug, listingType, filtersMap)
        .catch(err => {
          console.warn('Failed to update cascading filters:', err);
        })
        .finally(() => {
          setIsUpdatingCounts(false);
        });
    }
  }, [appliedFilters, categorySlug, listingType, isInitialized]);

  // Get selected value for an attribute
  const getSelectedValue = useCallback((key: string) => {
    const filter = appliedFilters.find(f => f.key === key);
    return filter?.valueLabel || null;
  }, [appliedFilters]);

  // Add/update a filter with cascading support - uses shared store
  const addFilter = useCallback((key: string, label: string, value: string, valueLabel: string) => {
    let updated = [...appliedFilters];
    const existingIdx = updated.findIndex(f => f.key === key);

    // CASCADING: If changing brand, clear model selection
    if (key === 'brandId') {
      updated = updated.filter(f => f.key !== 'modelId' && f.key !== 'variantId');
    }
    // CASCADING: If changing model, clear variant selection
    if (key === 'modelId') {
      updated = updated.filter(f => f.key !== 'variantId');
    }

    if (existingIdx >= 0) {
      updated[existingIdx] = { key, label, value, valueLabel };
    } else {
      updated.push({ key, label, value, valueLabel });
    }
    setAppliedFilters(updated);
  }, [appliedFilters, setAppliedFilters]);

  // Remove a filter with cascading support - uses shared store
  const removeFilter = useCallback((filterKey: string) => {
    let updated = appliedFilters.filter(f => f.key !== filterKey);

    // CASCADING: If removing brand, also clear model and variant
    if (filterKey === 'brandId') {
      updated = updated.filter(f => f.key !== 'modelId' && f.key !== 'variantId');
    }
    // CASCADING: If removing model, also clear variant
    if (filterKey === 'modelId') {
      updated = updated.filter(f => f.key !== 'variantId');
    }

    setAppliedFilters(updated);
    // Go back to attributes list after removing
    setSelectedAttribute(null);
  }, [appliedFilters, setAppliedFilters]);

  // Clear all filters - uses shared store
  const clearAllFilters = useCallback(() => {
    storeClearFilters();
  }, [storeClearFilters]);

  // Apply filters and go back
  const applyFilters = useCallback(() => {
    const filtersJson = JSON.stringify(appliedFilters);
    router.replace({
      pathname: `/search/${categorySlug}/${listingType}`,
      params: { appliedFilters: filtersJson },
    });
  }, [router, categorySlug, listingType, appliedFilters]);

  // Get current attribute data
  const currentAttribute = selectedAttribute
    ? attributes.find(a => a.key === selectedAttribute)
    : null;

  // Filter attributes that have options and should show in filter
  const filterableAttributes = useMemo(() => {
    return attributes.filter(attr => {
      // Must have options
      if (!attr.processedOptions || attr.processedOptions.length === 0) return false;
      // Check if should show in filter (from backend)
      if (attr.showInFilter === false) return false;
      // Exclude listingType - already handled at route level (sale/rent)
      if (attr.key === 'listingType') return false;
      return true;
    });
  }, [attributes]);

  // Check if an attribute should be disabled (e.g., model without brand)
  const isAttributeDisabled = useCallback((attrKey: string) => {
    // modelId requires brandId to be selected
    if (attrKey === 'modelId') {
      return !appliedFilters.some(f => f.key === 'brandId');
    }
    // variantId requires modelId to be selected
    if (attrKey === 'variantId') {
      return !appliedFilters.some(f => f.key === 'modelId');
    }
    return false;
  }, [appliedFilters]);

  // Render loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'الفلاتر',
            presentation: 'modal',
            headerBackVisible: false,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.headerButton}
              >
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="lg" />
            <Text variant="body" color="secondary" style={{ marginTop: 16 }}>
              جاري تحميل الفلاتر...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: selectedAttribute ? currentAttribute?.name || '' : 'الفلاتر',
          presentation: 'modal',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (selectedAttribute) {
                  setSelectedAttribute(null);
                } else {
                  router.back();
                }
              }}
              style={styles.headerButton}
            >
              {selectedAttribute ? (
                <ChevronLeft size={24} color={theme.colors.text} />
              ) : (
                <X size={24} color={theme.colors.text} />
              )}
            </TouchableOpacity>
          ),
          headerRight: () => {
            // Show clear button only when viewing options and has selection
            if (selectedAttribute && appliedFilters.some(f => f.key === selectedAttribute)) {
              return (
                <TouchableOpacity
                  onPress={() => removeFilter(selectedAttribute)}
                  style={styles.headerButton}
                >
                  <Text variant="body" color="primary">مسح</Text>
                </TouchableOpacity>
              );
            }
            return null;
          },
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        {selectedAttribute && currentAttribute ? (
          // Filter Options View
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {/* Special handling for body_type - show icon grid */}
            {selectedAttribute === 'body_type' ? (
              <View style={styles.iconGridContainer}>
                <IconGridSelector
                  options={currentAttribute.processedOptions.map(opt => ({
                    key: opt.key,
                    label: opt.value,
                    count: opt.count,
                  }))}
                  selected={appliedFilters
                    .filter(f => f.key === 'body_type')
                    .map(f => f.value)}
                  onChange={(selectedKeys) => {
                    // For body_type, we support single select (like web)
                    if (selectedKeys.length > 0) {
                      const selectedKey = selectedKeys[selectedKeys.length - 1];
                      const option = currentAttribute.processedOptions.find(o => o.key === selectedKey);
                      if (option) {
                        addFilter('body_type', currentAttribute.name, option.key, option.value);
                      }
                    } else {
                      // Deselected all - remove filter
                      removeFilter('body_type');
                    }
                    setSelectedAttribute(null);
                  }}
                  iconType="car-types"
                  singleSelect={true}
                  showCounts={true}
                />
              </View>
            ) : (
              /* Regular options list for other attributes */
              currentAttribute.processedOptions.map((option) => {
                const isSelected = appliedFilters.some(
                  f => f.key === selectedAttribute && f.value === option.key
                );
                // For brandId, always show all options (allows switching brands)
                // For others, skip options with 0 count unless selected
                const shouldShow = selectedAttribute === 'brandId' || option.count > 0 || isSelected;
                if (!shouldShow) return null;

                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected,
                    ]}
                    onPress={() => {
                      addFilter(
                        selectedAttribute,
                        currentAttribute.name,
                        option.key,
                        option.value
                      );
                      setSelectedAttribute(null);
                    }}
                  >
                    <View style={styles.optionContent}>
                      <Text variant="body" style={isSelected && styles.optionTextSelected}>
                        {option.value}
                      </Text>
                      <Text variant="small" color="secondary">({option.count})</Text>
                    </View>
                    {isSelected && (
                      <Check size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            {currentAttribute.processedOptions.length === 0 && (
              <View style={styles.emptyOptions}>
                <Text variant="body" color="secondary">لا توجد خيارات متاحة</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          // Filter Attributes List View
          <ScrollView style={styles.attributesList} showsVerticalScrollIndicator={false}>
            {filterableAttributes.map((attr) => {
              const selectedValue = getSelectedValue(attr.key);
              const activeOptionsCount = attr.processedOptions?.filter(o => o.count > 0).length || 0;
              const disabled = isAttributeDisabled(attr.key);
              const hasNoOptions = activeOptionsCount === 0;

              return (
                <TouchableOpacity
                  key={attr.key}
                  style={[
                    styles.attributeItem,
                    (disabled || hasNoOptions) && styles.attributeItemDisabled,
                  ]}
                  onPress={() => !disabled && !hasNoOptions && setSelectedAttribute(attr.key)}
                  disabled={disabled || hasNoOptions}
                >
                  <View style={styles.attributeContent}>
                    <View style={styles.attributeLabel}>
                      <Text
                        variant="body"
                        color={(disabled || hasNoOptions) ? 'muted' : undefined}
                      >
                        {attr.name}
                      </Text>
                      {activeOptionsCount > 0 && (
                        <Text variant="xs" color="secondary">
                          ({activeOptionsCount})
                        </Text>
                      )}
                    </View>
                    {selectedValue && (
                      <Text variant="small" color="primary">{selectedValue}</Text>
                    )}
                    {disabled && attr.key === 'modelId' && (
                      <Text variant="xs" color="muted">اختر العلامة أولاً</Text>
                    )}
                  </View>
                  <ChevronLeft
                    size={20}
                    color={(disabled || hasNoOptions) ? theme.colors.border : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}

            {filterableAttributes.length === 0 && (
              <View style={styles.emptyOptions}>
                <Text variant="body" color="secondary">لا توجد فلاتر متاحة لهذا القسم</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {appliedFilters.length > 0 && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
              <Trash2 size={16} color={theme.colors.text} />
              <Text variant="body">مسح الكل</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={applyFilters}
            style={[
              styles.showResultsButton,
              appliedFilters.length === 0 && styles.showResultsButtonFull,
            ]}
          >
            <Text variant="body" style={styles.showResultsText}>
              {isUpdatingCounts ? `عرض النتائج...` : `عرض النتائج (${totalResults || 0})`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    headerButton: {
      padding: theme.spacing.sm,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Attributes List (filter categories)
    attributesList: {
      flex: 1,
    },
    attributeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    attributeItemDisabled: {
      opacity: 0.5,
    },
    attributeContent: {
      flex: 1,
      alignItems: 'flex-end',
    },
    attributeLabel: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },

    // Options List
    optionsList: {
      flex: 1,
    },
    iconGridContainer: {
      padding: theme.spacing.md,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionItemSelected: {
      backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}10`,
    },
    optionContent: {
      flex: 1,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    optionTextSelected: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    emptyOptions: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },

    // Footer
    footer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.md,
      backgroundColor: theme.colors.bg,
    },
    clearAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.xs,
    },
    showResultsButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.full,
    },
    showResultsButtonFull: {
      flex: 1,
    },
    showResultsText: {
      color: '#FFF',
      fontWeight: '600',
    },
  });
