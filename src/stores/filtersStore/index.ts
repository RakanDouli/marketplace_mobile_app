/**
 * Filters Store - Mobile App
 * Handles filter attributes and aggregations for category listings
 */

import { create } from 'zustand';
import { cachedGraphqlRequest } from '../../services/graphql/client';
import {
  GET_CATEGORY_ATTRIBUTES_QUERY,
  GET_LISTING_AGGREGATIONS_QUERY,
} from './filtersStore.gql';

// ============================================================
// TYPES
// ============================================================

export interface AttributeOption {
  id: string;
  key: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  showInGrid?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
  showInFilter?: boolean;
}

export interface Attribute {
  id: string;
  key: string;
  name: string; // Arabic name
  type: string;
  validation?: any;
  sortOrder: number;
  group?: string;
  groupOrder?: number;
  isActive: boolean;
  isGlobal?: boolean;
  showInGrid?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
  showInFilter?: boolean;
  config?: any;
  options: AttributeOption[];
}

export interface AttributeOptionWithCount extends AttributeOption {
  count: number;
  modelId?: string;   // For variant options - parent model ID
  modelName?: string; // For variant options - parent model name for grouping
}

export interface AttributeWithCounts extends Attribute {
  processedOptions: AttributeOptionWithCount[];
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  valueLabel: string;
}

// ============================================================
// STATE & ACTIONS
// ============================================================

interface FiltersState {
  // Filter attributes with counts
  attributes: AttributeWithCounts[];
  totalResults: number;

  // Current applied filters
  appliedFilters: ActiveFilter[];

  // Cache management
  currentCategorySlug: string | null;
  cacheTimestamp: number | null;

  // Loading states
  isLoading: boolean;
  isLoadingCounts: boolean;
  error: string | null;
}

interface FiltersActions {
  // Main data fetching
  fetchFilterData: (categorySlug: string, listingType?: string) => Promise<void>;

  // Cascading filter updates (when user selects a filter)
  updateFiltersWithCascading: (
    categorySlug: string,
    listingType: string,
    appliedFilters: Record<string, string>
  ) => Promise<void>;

  // Filter management
  setAppliedFilters: (filters: ActiveFilter[]) => void;
  addFilter: (filter: ActiveFilter) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;

  // Reset
  resetFilters: () => void;
}

type FiltersStore = FiltersState & FiltersActions;

// Cache duration: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

const initialState: FiltersState = {
  attributes: [],
  totalResults: 0,
  appliedFilters: [],
  currentCategorySlug: null,
  cacheTimestamp: null,
  isLoading: false,
  isLoadingCounts: false,
  error: null,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function getListingAggregations(
  categorySlug?: string,
  additionalFilter?: any
): Promise<{
  attributes: Record<string, Record<string, number>>;
  provinces: Record<string, number>;
  totalResults: number;
  rawAggregations?: any;
}> {
  const variables: any = {};
  if (categorySlug || additionalFilter) {
    variables.filter = {
      ...(categorySlug && { categoryId: categorySlug }),
      ...additionalFilter,
    };
  }

  const response = await cachedGraphqlRequest<any>(
    GET_LISTING_AGGREGATIONS_QUERY,
    variables,
    2 * 60 * 1000 // Cache for 2 minutes
  );

  const aggregations = response.listingsAggregations;
  if (!aggregations) {
    return { attributes: {}, provinces: {}, totalResults: 0 };
  }

  // Transform attributes to counts map
  const attributes: Record<string, Record<string, number>> = {};
  (aggregations.attributes || []).forEach((attr: any) => {
    attributes[attr.field] = {};
    (attr.options || []).forEach((option: any) => {
      const lookupKey = option.key || option.value;
      attributes[attr.field][lookupKey] = option.count;
    });
  });

  // Transform provinces to counts map
  const provinces: Record<string, number> = {};
  (aggregations.provinces || []).forEach((province: any) => {
    provinces[province.value] = province.count;
  });

  return {
    attributes,
    provinces,
    totalResults: aggregations.totalResults || 0,
    rawAggregations: aggregations,
  };
}

// ============================================================
// STORE
// ============================================================

export const useFiltersStore = create<FiltersStore>((set, get) => ({
  ...initialState,

  fetchFilterData: async (categorySlug: string, listingType?: string) => {
    const { currentCategorySlug, cacheTimestamp } = get();
    const now = Date.now();

    // Check if cache is valid
    if (
      currentCategorySlug === categorySlug &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_TTL
    ) {
      return; // Use cached data
    }

    set({ isLoading: true, error: null });

    try {
      // Fetch category attributes
      const attributesData = await cachedGraphqlRequest<any>(
        GET_CATEGORY_ATTRIBUTES_QUERY,
        { categorySlug },
        CACHE_TTL
      );

      const rawAttributes: Attribute[] = attributesData.getAttributesByCategorySlug || [];

      // Fetch aggregations for counts
      const aggregationFilter = listingType ? { listingType: listingType.toUpperCase() } : undefined;
      const aggregations = await getListingAggregations(categorySlug, aggregationFilter);

      // Process attributes with counts
      const attributesWithCounts: AttributeWithCounts[] = rawAttributes
        .filter(attr => attr.showInFilter !== false)
        .map((attr) => {
          let processedOptions: AttributeOptionWithCount[] = [];

          // Special handling for brandId, modelId, variantId - get from raw aggregations
          if (attr.key === 'brandId' || attr.key === 'modelId' || attr.key === 'variantId') {
            const rawAttributeData = aggregations.rawAggregations?.attributes?.find(
              (a: any) => a.field === attr.key
            );
            if (rawAttributeData?.options) {
              processedOptions = rawAttributeData.options.map((option: any) => ({
                id: option.key || option.value,
                key: option.key || option.value,
                value: option.value,
                sortOrder: 0,
                isActive: true,
                count: option.count,
                // Include model info for variant grouping
                modelId: option.modelId,
                modelName: option.modelName,
              }));
            }
          } else {
            // Regular attributes - use existing options with counts
            processedOptions = (attr.options || [])
              .filter(opt => opt.showInFilter !== false)
              .map((opt) => ({
                ...opt,
                count: aggregations.attributes?.[attr.key]?.[opt.key] || 0,
              }));
          }

          return {
            ...attr,
            processedOptions,
          };
        });

      // Add location/province as a special attribute ONLY if not already in attributes
      const hasLocationAttr = attributesWithCounts.some(
        attr => attr.key === 'province' || attr.key === 'location'
      );
      if (!hasLocationAttr && Object.keys(aggregations.provinces).length > 0) {
        const locationOptions: AttributeOptionWithCount[] = Object.entries(aggregations.provinces)
          .map(([key, count]) => ({
            id: key,
            key: key,
            value: key, // Will be translated in UI
            sortOrder: 0,
            isActive: true,
            count: count as number,
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending

        attributesWithCounts.push({
          id: 'location',
          key: 'province', // Match the filter key used in listings
          name: 'المحافظة',
          type: 'select',
          sortOrder: 999,
          isActive: true,
          showInFilter: true,
          options: [],
          processedOptions: locationOptions,
        });
      }

      set({
        attributes: attributesWithCounts,
        totalResults: aggregations.totalResults,
        currentCategorySlug: categorySlug,
        cacheTimestamp: now,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch filter data:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to load filters',
      });
    }
  },

  updateFiltersWithCascading: async (
    categorySlug: string,
    listingType: string,
    appliedFiltersMap: Record<string, string>
  ) => {
    // Don't block UI - set loading but continue
    set({ isLoadingCounts: true, error: null });

    try {
      // Build filter object for cascading
      const filter: any = {
        listingType: listingType.toUpperCase(),
        specs: {},
      };

      // Add applied filters to specs
      Object.entries(appliedFiltersMap).forEach(([key, value]) => {
        if (key === 'province') {
          filter.province = value;
        } else if (value) {
          filter.specs[key] = value;
        }
      });

      // Get fresh aggregations with applied filters (with timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const aggregations = await Promise.race([
        getListingAggregations(categorySlug, filter),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof getListingAggregations>>;

      // Update attributes with new counts
      const { attributes: currentAttributes } = get();
      const updatedAttributes = currentAttributes.map((attr) => {
        let processedOptions: AttributeOptionWithCount[];

        if (attr.key === 'brandId') {
          // IMPORTANT: Keep ALL brand options, just update counts
          // This allows user to switch brands even after selecting one
          const rawAttributeData = aggregations.rawAggregations?.attributes?.find(
            (a: any) => a.field === attr.key
          );
          const countMap = new Map<string, number>();
          if (rawAttributeData?.options) {
            rawAttributeData.options.forEach((option: any) => {
              countMap.set(option.key || option.value, option.count);
            });
          }
          // Keep existing options, update counts (0 if not in aggregation)
          processedOptions = attr.processedOptions.map(opt => ({
            ...opt,
            count: countMap.get(opt.key) ?? 0,
          }));
        } else if (attr.key === 'modelId' || attr.key === 'variantId') {
          // For model/variant, replace options with what's returned from aggregation
          // Include modelId/modelName for grouped display
          const rawAttributeData = aggregations.rawAggregations?.attributes?.find(
            (a: any) => a.field === attr.key
          );
          if (rawAttributeData?.options && rawAttributeData.options.length > 0) {
            processedOptions = rawAttributeData.options.map((option: any) => ({
              id: option.key || option.value,
              key: option.key || option.value,
              value: option.value,
              sortOrder: 0,
              isActive: true,
              count: option.count,
              modelId: option.modelId,
              modelName: option.modelName,
            }));
          } else {
            // No options available for this filter combination
            processedOptions = [];
          }
        } else if (attr.key === 'province') {
          // Update province counts
          processedOptions = attr.processedOptions.map((opt) => ({
            ...opt,
            count: aggregations.provinces?.[opt.key] || 0,
          }));
        } else {
          // Regular attributes - keep options, update counts
          processedOptions = attr.processedOptions.map((opt) => ({
            ...opt,
            count: aggregations.attributes?.[attr.key]?.[opt.key] || 0,
          }));
        }

        return {
          ...attr,
          processedOptions,
        };
      });

      set({
        attributes: updatedAttributes,
        totalResults: aggregations.totalResults,
        isLoadingCounts: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to update cascading filters:', error);
      set({
        isLoadingCounts: false,
        error: error.message || 'Failed to update filters',
      });
    }
  },

  setAppliedFilters: (filters: ActiveFilter[]) => {
    set({ appliedFilters: filters });
  },

  addFilter: (filter: ActiveFilter) => {
    const { appliedFilters } = get();
    const existing = appliedFilters.findIndex((f) => f.key === filter.key);

    if (existing >= 0) {
      const updated = [...appliedFilters];
      updated[existing] = filter;
      set({ appliedFilters: updated });
    } else {
      set({ appliedFilters: [...appliedFilters, filter] });
    }
  },

  removeFilter: (key: string) => {
    const { appliedFilters } = get();
    set({ appliedFilters: appliedFilters.filter((f) => f.key !== key) });
  },

  clearFilters: () => {
    set({ appliedFilters: [] });
  },

  resetFilters: () => {
    set(initialState);
  },
}));

// ============================================================
// SELECTORS
// ============================================================

export const useFilterAttributes = () => useFiltersStore((state) => state.attributes);
export const useFilterTotalResults = () => useFiltersStore((state) => state.totalResults);
export const useAppliedFilters = () => useFiltersStore((state) => state.appliedFilters);
export const useFiltersLoading = () => useFiltersStore((state) => state.isLoading);
export const useFiltersCountsLoading = () => useFiltersStore((state) => state.isLoadingCounts);

export default useFiltersStore;
