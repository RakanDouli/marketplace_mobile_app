/**
 * User Listings Store
 * Zustand store for managing user's own listings
 * PORTED FROM WEB FRONTEND
 */

import { create } from 'zustand';
import { graphqlRequest } from '../../services/graphql/client';
import {
  MY_LISTINGS_QUERY,
  MY_LISTINGS_COUNT_QUERY,
  MY_LISTING_BY_ID_QUERY,
  UPDATE_MY_LISTING_MUTATION,
  DELETE_MY_LISTING_MUTATION,
} from './userListingsStore.gql';

// =============================================================================
// TYPES
// =============================================================================

export type ListingStatus =
  | 'ACTIVE'
  | 'DRAFT'
  | 'SOLD'
  | 'HIDDEN'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'ARCHIVED';

export interface UserListing {
  id: string;
  title: string;
  priceMinor: number;
  status: ListingStatus;
  imageKeys: string[];
  videoUrl?: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
  rejectionMessage?: string | null;
  description?: string;
  specs?: Record<string, any>;
  specsDisplay?: Record<string, any>;
  allowBidding?: boolean;
  biddingStartPrice?: number | null;
  location?: {
    province?: string;
    city?: string;
    area?: string;
    link?: string;
  };
  category?: {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
  };
}

export type ArchivalReason = 'sold_via_platform' | 'sold_externally' | 'no_longer_for_sale';

interface UserListingsState {
  listings: UserListing[];
  currentListing: UserListing | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    status?: ListingStatus;
    search?: string;
  };
}

interface UserListingsActions {
  // Load user's listings
  loadMyListings: (filters?: Partial<UserListingsState['filters']>, page?: number) => Promise<void>;

  // Load more listings (pagination)
  loadMoreListings: () => Promise<void>;

  // Refresh listings (pull-to-refresh)
  refreshMyListings: () => Promise<void>;

  // Load single listing by ID
  loadMyListingById: (id: string) => Promise<UserListing>;

  // Update listing
  updateMyListing: (id: string, input: any) => Promise<void>;

  // Delete listing
  deleteMyListing: (id: string, archivalReason: ArchivalReason) => Promise<void>;

  // Set filters
  setFilters: (filters: Partial<UserListingsState['filters']>) => void;

  // Clear current listing
  clearCurrentListing: () => void;

  // Clear error
  clearError: () => void;

  // Reset store
  reset: () => void;
}

type UserListingsStore = UserListingsState & UserListingsActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: UserListingsState = {
  listings: [],
  currentListing: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  filters: {},
};

// =============================================================================
// STORE
// =============================================================================

export const useUserListingsStore = create<UserListingsStore>((set, get) => ({
  ...initialState,

  loadMyListings: async (filters?: Partial<UserListingsState['filters']>, page?: number) => {
    set({ isLoading: true, error: null });

    try {
      const state = get();
      const currentFilters = { ...state.filters, ...filters };
      const currentPage = page ?? 1;
      const offset = (currentPage - 1) * state.pagination.limit;

      // Fetch listings
      const listingsData = await graphqlRequest<{ myListings: UserListing[] }>(
        MY_LISTINGS_QUERY,
        {
          status: currentFilters.status || null,
          limit: state.pagination.limit,
          offset,
        },
        true // requireAuth
      );

      // Fetch total count
      const countData = await graphqlRequest<{ myListingsCount: number }>(
        MY_LISTINGS_COUNT_QUERY,
        {
          status: currentFilters.status || null,
        },
        true
      );

      const total = countData.myListingsCount;
      const listings = listingsData.myListings || [];

      set({
        listings: currentPage === 1 ? listings : [...state.listings, ...listings],
        filters: currentFilters,
        pagination: {
          ...state.pagination,
          page: currentPage,
          total,
          hasMore: (currentPage * state.pagination.limit) < total,
        },
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'فشل في تحميل الإعلانات',
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  loadMoreListings: async () => {
    const state = get();
    if (state.isLoading || !state.pagination.hasMore) return;

    const nextPage = state.pagination.page + 1;
    await get().loadMyListings(state.filters, nextPage);
  },

  refreshMyListings: async () => {
    set({ isRefreshing: true });
    await get().loadMyListings(get().filters, 1);
  },

  loadMyListingById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await graphqlRequest<{ myListingById: UserListing }>(
        MY_LISTING_BY_ID_QUERY,
        { id },
        true
      );

      set({
        currentListing: data.myListingById,
        isLoading: false,
      });

      return data.myListingById;
    } catch (error: any) {
      set({
        error: error.message || 'فشل في تحميل الإعلان',
        isLoading: false,
      });
      throw error;
    }
  },

  updateMyListing: async (id: string, input: any) => {
    set({ isLoading: true, error: null });

    try {
      await graphqlRequest(
        UPDATE_MY_LISTING_MUTATION,
        { id, input },
        true
      );

      // Refresh listings after update
      await get().refreshMyListings();

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'فشل في تحديث الإعلان',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteMyListing: async (id: string, archivalReason: ArchivalReason) => {
    set({ isLoading: true, error: null });

    try {
      await graphqlRequest(
        DELETE_MY_LISTING_MUTATION,
        { id, archivalReason },
        true
      );

      // Remove from local state immediately
      set((state) => ({
        listings: state.listings.filter((l) => l.id !== id),
        pagination: {
          ...state.pagination,
          total: state.pagination.total - 1,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'فشل في حذف الإعلان',
        isLoading: false,
      });
      throw error;
    }
  },

  setFilters: (filters: Partial<UserListingsState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  clearCurrentListing: () => {
    set({ currentListing: null });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

export const useMyListings = () => useUserListingsStore((state) => state.listings);
export const useCurrentListing = () => useUserListingsStore((state) => state.currentListing);
export const useMyListingsLoading = () => useUserListingsStore((state) => state.isLoading);
export const useMyListingsRefreshing = () => useUserListingsStore((state) => state.isRefreshing);
export const useMyListingsPagination = () => useUserListingsStore((state) => state.pagination);
export const useMyListingsError = () => useUserListingsStore((state) => state.error);
