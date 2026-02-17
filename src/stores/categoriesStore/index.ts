/**
 * Categories Store - Fetch and cache categories from backend
 * Matching web frontend pattern
 */

import { create } from 'zustand';
import { cachedGraphqlRequest } from '../../services/graphql/client';
import { CATEGORIES_QUERY } from './categoriesStore.gql';

// ============================================================
// TYPES
// ============================================================

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  isActive: boolean;
  icon?: string;
  supportedListingTypes: string[];
}

interface CategoriesState {
  categories: Category[];
  selectedCategory: Category | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  fetchCategories: () => Promise<void>;
  setSelectedCategory: (category: Category | null) => void;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryBySlug: (slug: string) => Category | undefined;
  clearError: () => void;
}

// Cache duration: 10 minutes
const CACHE_TTL = 10 * 60 * 1000;

// ============================================================
// STORE
// ============================================================

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  fetchCategories: async () => {
    const { isInitialized } = get();

    // Skip if already initialized
    if (isInitialized) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphqlRequest<{
        categories: Category[];
      }>(CATEGORIES_QUERY, {}, CACHE_TTL);

      const categories = (data.categories || [])
        .filter((cat) => cat.isActive)
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          nameAr: cat.nameAr || cat.name,
          slug: cat.slug,
          isActive: cat.isActive,
          icon: cat.icon,
          supportedListingTypes: cat.supportedListingTypes || ['sale'],
        }));

      set({
        categories,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to load categories',
        isInitialized: false,
      });
    }
  },

  setSelectedCategory: (category: Category | null) => {
    set({ selectedCategory: category });
  },

  getCategoryById: (id: string) => {
    const { categories } = get();
    return categories.find((cat) => cat.id === id);
  },

  getCategoryBySlug: (slug: string) => {
    const { categories } = get();
    return categories.find((cat) => cat.slug === slug);
  },

  clearError: () => set({ error: null }),
}));

// ============================================================
// SELECTORS
// ============================================================

export const useCategories = () => useCategoriesStore((state) => state.categories);
export const useSelectedCategory = () => useCategoriesStore((state) => state.selectedCategory);
export const useCategoriesLoading = () => useCategoriesStore((state) => state.isLoading);

export default useCategoriesStore;
