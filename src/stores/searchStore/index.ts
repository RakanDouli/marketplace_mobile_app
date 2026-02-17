/**
 * Search Store - Manages search and filter state
 * Mirrors web frontend searchStore pattern
 */

import { create } from 'zustand';

// Types for search filters
export interface SearchFilters {
  // Category
  categoryId?: string;

  // Listing type (sale/rent)
  listingType?: string;

  // Search query
  search?: string;

  // Brand and Model
  brandId?: string;
  modelId?: string;

  // Price filters
  priceMinMinor?: number;
  priceMaxMinor?: number;

  // Location filters
  province?: string;

  // Dynamic specs (all attribute filters)
  specs?: Record<string, any>;

  // Sort option
  sort?: string;

  // Pagination
  page?: number;
  limit?: number;
}

// Filter chip for display
export interface FilterChip {
  key: string;
  value: string;
  label: string;  // Display label (Arabic)
}

// Store state interface
interface SearchState {
  // Applied filters (used for API calls)
  appliedFilters: SearchFilters;

  // Draft filters (for mobile filter panel before apply)
  draftFilters: SearchFilters;
}

// Store actions interface
interface SearchActions {
  // Applied filters (immediate effect)
  setFilter: (key: keyof SearchFilters, value: any) => void;
  setSpecFilter: (specKey: string, value: any) => void;
  removeFilter: (key: keyof SearchFilters) => void;
  removeSpecFilter: (specKey: string) => void;
  clearAllFilters: () => void;
  setFilters: (filters: Partial<SearchFilters>) => void;

  // Draft filters (UI state, requires apply)
  setDraftFilter: (key: keyof SearchFilters, value: any) => void;
  setDraftSpecFilter: (specKey: string, value: any) => void;
  applyDrafts: () => void;
  resetDrafts: () => void;

  // URL management
  setFromUrlParams: (params: Record<string, string | undefined>) => void;

  // Utility
  hasActiveFilters: () => boolean;
  getFilterChips: () => FilterChip[];
  getStoreFilters: () => any;
}

type SearchStore = SearchState & SearchActions;

const initialFilters: SearchFilters = {
  page: 1,
  limit: 20,
};

const initialState: SearchState = {
  appliedFilters: initialFilters,
  draftFilters: initialFilters,
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  ...initialState,

  // Set individual applied filter (immediate effect)
  setFilter: (key: keyof SearchFilters, value: any) => {
    const { appliedFilters } = get();
    const newFilters = { ...appliedFilters };

    if (value === null || value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    // Reset page when filters change (except when setting page itself)
    if (key !== 'page') {
      newFilters.page = 1;
    }

    set({ appliedFilters: newFilters });
  },

  // Set spec filter (dynamic attributes)
  setSpecFilter: (specKey: string, value: any) => {
    const { appliedFilters } = get();
    const newSpecs = { ...appliedFilters.specs };

    if (value === null || value === undefined || value === '') {
      delete newSpecs[specKey];
    } else {
      newSpecs[specKey] = value;
    }

    const newFilters = {
      ...appliedFilters,
      specs: Object.keys(newSpecs).length > 0 ? newSpecs : undefined,
      page: 1,
    };

    set({ appliedFilters: newFilters });
  },

  // Remove individual filter
  removeFilter: (key: keyof SearchFilters) => {
    const { appliedFilters, draftFilters } = get();
    const newAppliedFilters = { ...appliedFilters };
    const newDraftFilters = { ...draftFilters };
    delete newAppliedFilters[key];
    delete newDraftFilters[key];

    set({ appliedFilters: newAppliedFilters, draftFilters: newDraftFilters });
  },

  // Remove spec filter
  removeSpecFilter: (specKey: string) => {
    const { appliedFilters, draftFilters } = get();

    const newAppliedSpecs = appliedFilters.specs ? { ...appliedFilters.specs } : {};
    delete newAppliedSpecs[specKey];
    const newAppliedFilters = {
      ...appliedFilters,
      specs: Object.keys(newAppliedSpecs).length > 0 ? newAppliedSpecs : undefined,
    };

    const newDraftSpecs = draftFilters.specs ? { ...draftFilters.specs } : {};
    delete newDraftSpecs[specKey];
    const newDraftFilters = {
      ...draftFilters,
      specs: Object.keys(newDraftSpecs).length > 0 ? newDraftSpecs : undefined,
    };

    set({ appliedFilters: newAppliedFilters, draftFilters: newDraftFilters });
  },

  // Clear all filters (preserves listingType and categoryId)
  clearAllFilters: () => {
    const { appliedFilters } = get();
    const preservedListingType = appliedFilters.listingType;
    const preservedCategoryId = appliedFilters.categoryId;
    set({
      appliedFilters: { ...initialFilters, listingType: preservedListingType, categoryId: preservedCategoryId },
      draftFilters: { ...initialFilters, listingType: preservedListingType, categoryId: preservedCategoryId },
    });
  },

  // Set multiple filters at once
  setFilters: (filters: Partial<SearchFilters>) => {
    const { appliedFilters } = get();
    const newFilters = { ...appliedFilters, ...filters };
    set({ appliedFilters: newFilters, draftFilters: { ...newFilters } });
  },

  // === DRAFT FILTER METHODS ===

  setDraftFilter: (key: keyof SearchFilters, value: any) => {
    const { draftFilters } = get();
    const newDrafts = { ...draftFilters };

    if (value === null || value === undefined || value === '') {
      delete newDrafts[key];
    } else {
      newDrafts[key] = value;
    }

    set({ draftFilters: newDrafts });
  },

  setDraftSpecFilter: (specKey: string, value: any) => {
    const { draftFilters } = get();
    const newSpecs = { ...draftFilters.specs };

    if (value === null || value === undefined || value === '') {
      delete newSpecs[specKey];
    } else {
      newSpecs[specKey] = value;
    }

    const newDrafts = {
      ...draftFilters,
      specs: Object.keys(newSpecs).length > 0 ? newSpecs : undefined,
    };

    set({ draftFilters: newDrafts });
  },

  applyDrafts: () => {
    const { draftFilters } = get();
    const newApplied = { ...draftFilters, page: 1 };
    set({ appliedFilters: newApplied });
  },

  resetDrafts: () => {
    const { appliedFilters } = get();
    set({ draftFilters: { ...appliedFilters } });
  },

  // === URL MANAGEMENT ===

  setFromUrlParams: (params: Record<string, string | undefined>) => {
    const { appliedFilters } = get();
    const newFilters: SearchFilters = {
      ...initialFilters,
      categoryId: appliedFilters.categoryId,
      listingType: appliedFilters.listingType,
    };

    if (params.search) newFilters.search = params.search;
    if (params.province) newFilters.province = params.province;
    if (params.minPrice) newFilters.priceMinMinor = parseFloat(params.minPrice);
    if (params.maxPrice) newFilters.priceMaxMinor = parseFloat(params.maxPrice);
    if (params.brandId) {
      newFilters.specs = { ...newFilters.specs, brandId: params.brandId };
    }
    if (params.modelId) {
      newFilters.specs = { ...newFilters.specs, modelId: params.modelId };
    }

    set({
      appliedFilters: newFilters,
      draftFilters: { ...newFilters },
    });
  },

  // === UTILITY ===

  hasActiveFilters: () => {
    const { appliedFilters } = get();
    // Check if any filter besides categoryId, listingType, page, limit is set
    return !!(
      appliedFilters.search ||
      appliedFilters.province ||
      appliedFilters.priceMinMinor ||
      appliedFilters.priceMaxMinor ||
      appliedFilters.brandId ||
      appliedFilters.modelId ||
      (appliedFilters.specs && Object.keys(appliedFilters.specs).length > 0)
    );
  },

  // Get filter chips for display
  getFilterChips: () => {
    const { appliedFilters } = get();
    const chips: FilterChip[] = [];

    if (appliedFilters.search) {
      chips.push({ key: 'search', value: appliedFilters.search, label: `"${appliedFilters.search}"` });
    }

    if (appliedFilters.province) {
      chips.push({ key: 'province', value: appliedFilters.province, label: appliedFilters.province });
    }

    if (appliedFilters.priceMinMinor || appliedFilters.priceMaxMinor) {
      const min = appliedFilters.priceMinMinor ? `${appliedFilters.priceMinMinor}` : '';
      const max = appliedFilters.priceMaxMinor ? `${appliedFilters.priceMaxMinor}` : '';
      chips.push({ key: 'price', value: `${min}-${max}`, label: `${min} - ${max}` });
    }

    // Add spec filters as chips
    if (appliedFilters.specs) {
      Object.entries(appliedFilters.specs).forEach(([key, value]) => {
        if (value) {
          chips.push({ key: `spec_${key}`, value: String(value), label: String(value) });
        }
      });
    }

    return chips;
  },

  // Convert to store filters format for listings fetch
  getStoreFilters: () => {
    const { appliedFilters } = get();
    const filters: any = {};

    if (appliedFilters.categoryId) filters.categoryId = appliedFilters.categoryId;
    if (appliedFilters.listingType) filters.listingType = appliedFilters.listingType;
    if (appliedFilters.search) filters.search = appliedFilters.search;
    if (appliedFilters.province) filters.province = appliedFilters.province;
    if (appliedFilters.priceMinMinor) filters.priceMinMinor = appliedFilters.priceMinMinor;
    if (appliedFilters.priceMaxMinor) filters.priceMaxMinor = appliedFilters.priceMaxMinor;

    // Specs
    if (appliedFilters.specs && Object.keys(appliedFilters.specs).length > 0) {
      filters.specs = appliedFilters.specs;
    }

    return filters;
  },
}));

// Selectors
export const useAppliedFilters = () => useSearchStore((state) => state.appliedFilters);
export const useDraftFilters = () => useSearchStore((state) => state.draftFilters);
export const useFilterChips = () => useSearchStore((state) => state.getFilterChips());
export const useHasActiveFilters = () => useSearchStore((state) => state.hasActiveFilters());
