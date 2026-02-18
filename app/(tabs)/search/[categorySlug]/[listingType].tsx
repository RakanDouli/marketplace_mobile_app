/**
 * Category Listings Screen
 * Shows listings for a specific category and listing type (sale/rent)
 * Supports grid and list view modes with filters
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Trash2,
  ArrowDownUp,
} from 'lucide-react-native';
import { useTheme, Theme } from '../../../../src/theme';
import { Text, Loading, Button } from '../../../../src/components/slices';
import { ListingCard } from '../../../../src/components/listing';
import { SearchBar } from '../../../../src/components/search';
import { useCategoriesStore } from '../../../../src/stores/categoriesStore';
import { useListingsStore, type Listing } from '../../../../src/stores/listingsStore';
import { useCurrencyStore } from '../../../../src/stores/currencyStore';
import { useMetadataStore } from '../../../../src/stores/metadataStore';
import { useFiltersStore, type ActiveFilter } from '../../../../src/stores/filtersStore';
import { formatPrice } from '../../../../src/utils/formatPrice';
import { getListingImageUrl } from '../../../../src/services/cloudflare/images';

// Filter chip type for display
interface FilterChip {
  key: string;
  value: string;
  label: string;
}

const CARD_GAP = 12;

// View mode type
type ViewMode = 'grid' | 'list';

// Listing type labels
const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: 'للبيع',
  rent: 'للإيجار',
};

export default function CategoryListingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { categorySlug, listingType, appliedFilters: appliedFiltersParam, search: searchParam } = useLocalSearchParams<{
    categorySlug: string;
    listingType: string;
    appliedFilters?: string;
    search?: string;
  }>();

  // Responsive breakpoints - lower values to support Android tablets (dp values vary)
  const isTablet = screenWidth >= 600;
  const isDesktop = screenWidth >= 900;

  // Responsive columns: 2 mobile, 3 tablet, 4 desktop
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;

  // Calculate card width based on columns
  const horizontalPadding = isDesktop ? theme.spacing.md * 3 : isTablet ? theme.spacing.md * 2 : theme.spacing.md;
  const totalGapWidth = (gridColumns - 1) * CARD_GAP;
  const cardWidth = (screenWidth - horizontalPadding * 2 - totalGapWidth) / gridColumns;

  const styles = useMemo(
    () => createStyles(theme, screenWidth, isTablet, isDesktop, horizontalPadding, cardWidth),
    [theme, screenWidth, isTablet, isDesktop, horizontalPadding, cardWidth]
  );

  // Stores
  const { getCategoryBySlug, fetchCategories, categories } = useCategoriesStore();
  const {
    listings,
    isLoading,
    totalResults,
    hasMore,
    fetchListings,
    loadMoreListings,
    clearListings,
  } = useListingsStore();
  const preferredCurrency = useCurrencyStore((state) => state.preferredCurrency);
  const { provinces, fetchLocationMetadata } = useMetadataStore();
  const {
    attributes: filterAttributes,
    fetchFilterData,
    appliedFilters,
    setAppliedFilters,
    clearFilters: storeClearFilters,
  } = useFiltersStore();

  // Derive activeFilters object from shared store's appliedFilters array
  const activeFilters = useMemo(() => {
    const filtersMap: Record<string, any> = {};
    appliedFilters.forEach(f => {
      filtersMap[f.key] = f.value;
    });
    return filtersMap;
  }, [appliedFilters]);

  // Helper: Get province Arabic name from key
  const getProvinceArabicName = useCallback((provinceKey: string | undefined): string => {
    if (!provinceKey) return '';
    const province = provinces.find(
      (p) => p.key.toLowerCase() === provinceKey.toLowerCase()
    );
    return province?.nameAr || provinceKey;
  }, [provinces]);

  // Sorting options (matching web frontend)
  type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'priceMinor_asc' | 'priceMinor_desc';
  const SORT_OPTIONS: Record<SortOption, string> = {
    createdAt_desc: 'الأحدث',
    createdAt_asc: 'الأقدم',
    priceMinor_asc: 'السعر: من الأقل',
    priceMinor_desc: 'السعر: من الأعلى',
  };

  // Local state (UI only)
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt_desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Scroll animation for hiding/showing toolbar
  const TOOLBAR_HEIGHT = 100; // Approximate height of chips row + toolbar
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  // Track if toolbar is currently hidden
  const isToolbarHidden = useRef(false);

  // Handle scroll to show/hide toolbar
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    // At top - always show toolbar
    if (currentScrollY <= 5) {
      if (isToolbarHidden.current) {
        isToolbarHidden.current = false;
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }
    } else if (diff > 3 && !isToolbarHidden.current) {
      // Scrolling down fast enough - hide toolbar
      isToolbarHidden.current = true;
      Animated.timing(headerTranslateY, {
        toValue: -TOOLBAR_HEIGHT,
        duration: 120,
        useNativeDriver: true,
      }).start();
    } else if (diff < -2 && isToolbarHidden.current) {
      // Scrolling up - show toolbar
      isToolbarHidden.current = false;
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentScrollY;
  }, [headerTranslateY, TOOLBAR_HEIGHT]);

  // Initialize filters from URL params - sync to shared store
  // Re-run when URL params change (Expo Router params load asynchronously)
  useEffect(() => {
    const initialFilters: ActiveFilter[] = [];

    // Read search param from URL
    if (searchParam) {
      initialFilters.push({
        key: 'search',
        label: 'البحث',
        value: searchParam,
        valueLabel: searchParam,
      });
      // Also sync the search input field
      setSearchQuery(searchParam);
    }

    // Parse additional filters from appliedFilters URL param
    if (appliedFiltersParam) {
      try {
        const parsed = JSON.parse(appliedFiltersParam);
        parsed.forEach((filter: { key: string; value: string; label?: string; valueLabel?: string }) => {
          if (filter.key !== 'search') { // Don't duplicate search
            initialFilters.push({
              key: filter.key,
              label: filter.label || filter.key,
              value: filter.value,
              valueLabel: filter.valueLabel || filter.value,
            });
          }
        });
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Only update store if we have filters from URL
    if (initialFilters.length > 0 || appliedFiltersParam) {
      setAppliedFilters(initialFilters);
    }
  }, [searchParam, appliedFiltersParam, setAppliedFilters]); // Re-run when URL params become available

  // Helper: Get display label for an attribute value (lookup from filtersStore)
  const getAttributeValueLabel = useCallback((attrKey: string, valueKey: string): string => {
    const attr = filterAttributes.find(a => a.key === attrKey);
    if (attr) {
      const option = attr.processedOptions.find(o => o.key === valueKey);
      if (option) return option.value; // Return Arabic label
    }
    return valueKey; // Fallback to the key itself
  }, [filterAttributes]);

  // Compute filter chips from local state
  const filterChips = useMemo((): FilterChip[] => {
    const chips: FilterChip[] = [];
    const specialKeys = ['search', 'province', 'priceMinMinor', 'priceMaxMinor'];

    if (activeFilters.search) {
      chips.push({ key: 'search', value: activeFilters.search, label: `"${activeFilters.search}"` });
    }

    if (activeFilters.province) {
      chips.push({ key: 'province', value: activeFilters.province, label: getProvinceArabicName(activeFilters.province) });
    }

    if (activeFilters.priceMinMinor || activeFilters.priceMaxMinor) {
      const min = activeFilters.priceMinMinor ? `${activeFilters.priceMinMinor}` : '';
      const max = activeFilters.priceMaxMinor ? `${activeFilters.priceMaxMinor}` : '';
      chips.push({ key: 'price', value: `${min}-${max}`, label: `${min} - ${max}` });
    }

    // Add attribute filters (brandId, modelId, fuel_type, etc.)
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && !specialKeys.includes(key)) {
        // Look up Arabic label from filtersStore
        const label = getAttributeValueLabel(key, String(value));
        chips.push({ key, value: String(value), label });
      }
    });

    return chips;
  }, [activeFilters, getProvinceArabicName, getAttributeValueLabel]);

  // Check if there are any active filters (including search)
  const hasActiveFilters = useMemo(() => {
    return Object.keys(activeFilters).some(key =>
      activeFilters[key] !== undefined && activeFilters[key] !== ''
    );
  }, [activeFilters]);

  // Remove a single filter - uses shared store
  const removeFilter = useCallback((filterKey: string) => {
    if (filterKey === 'search') {
      setSearchQuery('');
    }
    const updated = appliedFilters.filter(f => f.key !== filterKey);
    setAppliedFilters(updated);
  }, [appliedFilters, setAppliedFilters]);

  // Clear all filters - uses shared store (no URL update needed, store is source of truth)
  const clearAllFilters = useCallback(() => {
    storeClearFilters();
    setSearchQuery('');
  }, [storeClearFilters]);

  // Navigate to filters screen - pass current appliedFilters from store
  const openFilters = () => {
    // Use appliedFilters from store (already in correct format)
    // Exclude 'search' as it's handled separately in the search bar
    const filtersArray = appliedFilters
      .filter(f => f.key !== 'search')
      .map(f => ({ key: f.key, value: f.value, label: f.label, valueLabel: f.valueLabel }));
    const filtersJson = JSON.stringify(filtersArray);
    router.push(`/search/${categorySlug}/filters?listingType=${listingType}&filters=${encodeURIComponent(filtersJson)}`);
  };

  // Get category info
  const category = getCategoryBySlug(categorySlug || '');
  const listingTypeLabel = LISTING_TYPE_LABELS[listingType || 'sale'] || 'للبيع';

  // Fetch categories, provinces, and filter attributes if not loaded
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
    if (provinces.length === 0) {
      fetchLocationMetadata();
    }
    // Fetch filter attributes for proper label display in chips
    if (categorySlug && filterAttributes.length === 0) {
      fetchFilterData(categorySlug, listingType);
    }
  }, [categorySlug, listingType]);

  // Create stable filter key for dependency tracking
  const filterKey = useMemo(() => {
    return JSON.stringify(activeFilters);
  }, [activeFilters]);

  // Build specs object from active filters (excluding known non-spec fields)
  // Handles range filters (year, mileage) in "min-max" format
  const buildSpecsFromFilters = useCallback((filters: Record<string, any>) => {
    const nonSpecFields = ['search', 'province', 'priceMinMinor', 'priceMaxMinor', 'price', 'specs'];
    const rangeFields = ['year', 'mileage']; // Fields that should be converted to range format
    const specs: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (!nonSpecFields.includes(key) && value !== undefined && value !== '') {
        const strValue = String(value);

        // Check if this is a range value (format: "min-max")
        if (rangeFields.includes(key) && strValue.includes('-')) {
          const [minStr, maxStr] = strValue.split('-');
          const min = minStr ? parseInt(minStr, 10) : undefined;
          const max = maxStr ? parseInt(maxStr, 10) : undefined;

          if (min !== undefined || max !== undefined) {
            specs[key] = [min, max]; // Store as array [min, max] for backend
          }
        } else {
          specs[key] = strValue;
        }
      }
    });

    return Object.keys(specs).length > 0 ? specs : undefined;
  }, []);

  // Extract price min/max from filters (price is stored as "min-max" format)
  const extractPriceFilters = useCallback((filters: Record<string, any>) => {
    const priceValue = filters.price;
    if (!priceValue) return { priceMinMinor: undefined, priceMaxMinor: undefined };

    const strValue = String(priceValue);
    if (strValue.includes('-')) {
      const [minStr, maxStr] = strValue.split('-');
      const min = minStr && minStr !== '0' ? parseInt(minStr, 10) : undefined;
      const max = maxStr && maxStr !== '999999999' ? parseInt(maxStr, 10) : undefined;
      return { priceMinMinor: min, priceMaxMinor: max };
    }
    return { priceMinMinor: undefined, priceMaxMinor: undefined };
  }, []);

  // Fetch listings when filters or sort change
  useEffect(() => {
    if (!categorySlug || !listingType) return;

    const { priceMinMinor, priceMaxMinor } = extractPriceFilters(activeFilters);
    clearListings();
    fetchListings({
      categoryId: categorySlug,
      listingType: listingType.toUpperCase(),
      search: activeFilters.search,
      province: activeFilters.province,
      priceMinMinor,
      priceMaxMinor,
      specs: buildSpecsFromFilters(activeFilters),
      sort: sortBy,
    });
  }, [categorySlug, listingType, filterKey, sortBy, buildSpecsFromFilters, extractPriceFilters]);

  // Handle search from search bar - uses shared store
  const handleSearch = useCallback(() => {
    let updated = appliedFilters.filter(f => f.key !== 'search');
    if (searchQuery.trim()) {
      updated.push({
        key: 'search',
        label: 'البحث',
        value: searchQuery.trim(),
        valueLabel: searchQuery.trim(),
      });
    }
    setAppliedFilters(updated);
  }, [searchQuery, appliedFilters, setAppliedFilters]);

  // Handle refresh - uses derived activeFilters from store
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (categorySlug && listingType) {
      const { priceMinMinor, priceMaxMinor } = extractPriceFilters(activeFilters);
      clearListings();
      await fetchListings({
        categoryId: categorySlug,
        listingType: listingType.toUpperCase(),
        search: activeFilters.search,
        province: activeFilters.province,
        priceMinMinor,
        priceMaxMinor,
        specs: buildSpecsFromFilters(activeFilters),
        sort: sortBy,
      });
    }
    setIsRefreshing(false);
  }, [categorySlug, listingType, activeFilters, sortBy, clearListings, fetchListings, buildSpecsFromFilters, extractPriceFilters]);

  // Handle listing press
  const handleListingPress = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadMoreListings();
    }
  };

  // Get image URL from imageKeys - matches web frontend pattern
  const getImageUrl = (imageKeys: string[] | undefined): string | undefined => {
    if (!imageKeys || imageKeys.length === 0) {
      return undefined;
    }
    // Convert Cloudflare image ID to full URL
    return getListingImageUrl(imageKeys[0], 'card');
  };

  // Format listing for card - follows web frontend pattern
  const formatListingForCard = (listing: Listing, forListView = false) => {
    // Format location: "city، province (Arabic)" - matching web frontend
    const locationParts: string[] = [];
    if (listing.location?.city) {
      locationParts.push(listing.location.city);
    }
    if (listing.location?.province) {
      // Translate province key to Arabic name
      const provinceArabic = getProvinceArabicName(listing.location.province);
      locationParts.push(provinceArabic);
    }

    // Build specs string from specsDisplay - use | separator (matching web frontend)
    const specsArray: string[] = [];
    if (listing.specsDisplay) {
      Object.values(listing.specsDisplay).forEach((spec: any) => {
        if (spec?.value) {
          specsArray.push(spec.value);
        }
      });
    }

    // For list view, show more specs (up to 5), for grid show 3
    const maxSpecs = forListView ? 5 : 3;

    return {
      id: listing.id,
      title: listing.title,
      price: formatPrice(listing.priceMinor, preferredCurrency),
      location: locationParts.join('، '),
      specs: specsArray.slice(0, maxSpecs).join(' | '),
      // Convert image ID to full Cloudflare URL - matching web frontend
      imageUrl: getImageUrl(listing.imageKeys),
      userId: listing.user?.id,
    };
  };

  // Render listing card for grid view
  const renderGridItem = ({ item, index }: { item: Listing; index: number }) => {
    const formatted = formatListingForCard(item);
    // Calculate which column this item is in (RTL: columnIndex 0 is rightmost)
    const columnIndex = index % gridColumns;
    const isLastColumn = columnIndex === gridColumns - 1;

    return (
      <View style={[
        styles.gridCardWrapper,
        { width: cardWidth },
        // RTL with row-reverse: add marginLeft for gap (except leftmost column)
        !isLastColumn && { marginLeft: CARD_GAP },
      ]}>
        <ListingCard
          id={formatted.id}
          title={formatted.title}
          price={formatted.price}
          location={formatted.location}
          specs={formatted.specs}
          imageUrl={formatted.imageUrl}
          userId={formatted.userId}
          categorySlug={categorySlug}
          listingType={listingType}
          onPress={() => handleListingPress(formatted.id)}
          viewMode="grid"
        />
      </View>
    );
  };

  // Render listing card for list view - pass true to get more specs
  const renderListItem = ({ item }: { item: Listing }) => {
    const formatted = formatListingForCard(item, true);

    return (
      <View style={styles.listCardWrapper}>
        <ListingCard
          id={formatted.id}
          title={formatted.title}
          price={formatted.price}
          location={formatted.location}
          specs={formatted.specs}
          imageUrl={formatted.imageUrl}
          userId={formatted.userId}
          categorySlug={categorySlug}
          listingType={listingType}
          onPress={() => handleListingPress(formatted.id)}
          viewMode="list"
        />
      </View>
    );
  };

  // Render footer (loading more)
  const renderFooter = () => {
    if (!hasMore) return null;
    if (isLoading && listings.length > 0) {
      return (
        <View style={styles.footerLoading}>
          <Loading type="dots" size="sm" />
        </View>
      );
    }
    return null;
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
          لا توجد إعلانات
        </Text>
        <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
          لم يتم العثور على إعلانات {listingTypeLabel} في هذا القسم
        </Text>
      </View>
    );
  };

  // Render animated toolbar (fixed position, hides on scroll)
  const renderAnimatedToolbar = () => (
    <Animated.View
      style={[
        styles.animatedToolbar,
        { transform: [{ translateY: headerTranslateY }] },
      ]}
    >
      {/* Filter Chips Row: Filter Button (fixed) + Chips (scrollable) */}
      <View style={styles.chipsRow}>
        {/* Filter Button - fixed on right */}
        <TouchableOpacity
          onPress={openFilters}
          style={styles.filterButton}
        >
          <SlidersHorizontal size={16} color="#FFF" />
          <Text variant="small" style={styles.filterButtonText}>الفلاتر</Text>
          {filterChips.length > 0 && (
            <View style={styles.filterBadge}>
              <Text variant="xs" style={styles.filterBadgeText}>{filterChips.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Active Filter Chips - scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {filterChips.map((chip: FilterChip) => (
            <View key={chip.key} style={styles.filterChip}>
              <TouchableOpacity
                onPress={() => removeFilter(chip.key)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <Text variant="small">{chip.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Toolbar: Sort + View Toggle + Clear All (RTL order) */}
      <View style={styles.toolbar}>
        {/* Sort Dropdown - appears on right in RTL */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(!showSortMenu)}
          style={styles.sortButton}
        >
          <ArrowDownUp size={16} color={theme.colors.textSecondary} />
          <Text variant="body">{SORT_OPTIONS[sortBy]}</Text>
          <ChevronDown size={16} color={theme.colors.text} />
        </TouchableOpacity>

        {/* View Mode Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[
              styles.viewToggleButton,
              viewMode === 'list' && styles.viewToggleButtonActive,
            ]}
          >
            <List
              size={20}
              color={viewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            style={[
              styles.viewToggleButton,
              viewMode === 'grid' && styles.viewToggleButtonActive,
            ]}
          >
            <LayoutGrid
              size={20}
              color={viewMode === 'grid' ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Clear All Button - appears on left in RTL */}
        <Button
          variant="link"
          size="sm"
          icon={<Trash2 size={14} color={hasActiveFilters ? theme.colors.text : theme.colors.textMuted} />}
          onPress={clearAllFilters}
          disabled={!hasActiveFilters}
        >
          مسح الكل
        </Button>
      </View>

      {/* Sort Menu Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {(Object.keys(SORT_OPTIONS) as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortMenuItem,
                sortBy === option && styles.sortMenuItemActive,
              ]}
              onPress={() => {
                setSortBy(option);
                setShowSortMenu(false);
              }}
            >
              <Text
                variant="small"
                color={sortBy === option ? 'primary' : 'secondary'}
              >
                {SORT_OPTIONS[option]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerTitle: () => (
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder={`ابحث في ${category?.nameAr || ''} ${listingTypeLabel} (${totalResults})`}
              showCategorySelector={false}
              style={styles.headerSearchBar}
            />
          ),
          headerStyle: {
            backgroundColor: theme.colors.bg,
          },
          headerShadowVisible: false,
        }}
      />

      {/* Header Bottom Border */}
      <View style={styles.headerBorder} />

      <View style={styles.container}>
        {/* Animated Toolbar - Fixed position, hides on scroll down */}
        {renderAnimatedToolbar()}

        {/* Listings */}
        {isLoading && listings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="lg" />
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            numColumns={viewMode === 'grid' ? gridColumns : 1}
            key={`${viewMode}-${gridColumns}`} // Force re-render when view mode or columns change
            contentContainerStyle={[styles.listContent, { paddingTop: TOOLBAR_HEIGHT }]}
            columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
                progressViewOffset={TOOLBAR_HEIGHT}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </>
  );
}

const createStyles = (
  theme: Theme,
  screenWidth: number,
  isTablet: boolean,
  isDesktop: boolean,
  horizontalPadding: number,
  cardWidth: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },

    // SearchBar in native header
    headerSearchBar: {
      flex: 1,
      paddingVertical: 0,
      paddingHorizontal: 0,
      backgroundColor: 'transparent',
    },

    // Header bottom border (since headerStyle border doesn't always work)
    headerBorder: {
      height: 1,
      backgroundColor: theme.colors.border,
    },

    // Animated toolbar - fixed position, hides on scroll
    animatedToolbar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },

    // Chips Row - container with filter button fixed, chips scrollable
    chipsRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.bg,
      paddingHorizontal: horizontalPadding,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    chipsScroll: {
      flex: 1,
    },
    chipsContent: {
      flexDirection: 'row',
      flexGrow: 1,
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    filterButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      gap: theme.spacing.xs,
    },
    filterButtonText: {
      color: '#FFF',
    },
    filterBadge: {
      backgroundColor: '#FFF',
      borderRadius: theme.radius.full,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.xs,
    },
    filterBadgeText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    filterChip: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.xs,
    },

    // Toolbar Row
    toolbar: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: horizontalPadding,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sortButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    sortMenu: {
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    sortMenuItem: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    sortMenuItemActive: {
      backgroundColor: theme.colors.surface,
    },
    viewToggle: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    viewToggleButton: {
      padding: theme.spacing.sm,
    },
    viewToggleButtonActive: {
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
    },

    // Content
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
    },
    listContent: {
      paddingHorizontal: horizontalPadding,
      paddingBottom: 40,
    },
    row: {
      flexDirection: 'row-reverse',
      justifyContent: 'flex-start',
      marginBottom: CARD_GAP,
    },
    gridCardWrapper: {
      // Width is now set dynamically in renderGridItem
    },
    listCardWrapper: {
      marginBottom: theme.spacing.md,
    },
    footerLoading: {
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
    },
  });
