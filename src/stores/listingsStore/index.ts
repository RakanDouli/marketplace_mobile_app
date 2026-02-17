/**
 * Listings Store - Fetch and cache listings from backend
 * COPIED FROM WEB FRONTEND - Matching exact pattern
 */

import { create } from 'zustand';
import { cachedGraphqlRequest, graphqlRequest } from '../../services/graphql/client';
import {
  LISTINGS_GRID_QUERY,
  FEATURED_LISTINGS_QUERY,
  LISTING_BY_ID_QUERY,
} from './listingsStore.gql';

// ============================================================
// TYPES - Matching web frontend exactly
// ============================================================

export interface ListingLocation {
  city?: string;
  province?: string;
  area?: string;
  link?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ListingUser {
  id: string;
  name?: string;
  phone?: string;
  contactPhone?: string;
  phoneIsWhatsApp?: boolean;
  showPhone?: boolean;
  showContactPhone?: boolean;
  accountType?: string;
  companyName?: string;
  website?: string;
  companyRegistrationNumber?: string;
}

export interface ListingCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  priceMinor: number;
  status?: string;
  imageKeys: string[];
  videoUrl?: string;
  createdAt?: string;
  categoryId?: string;
  allowBidding?: boolean;
  biddingStartPrice?: number;
  listingType?: string;
  condition?: string;
  accountType?: string;
  location?: ListingLocation;
  specs: Record<string, any>;
  specsDisplay: Record<string, any>;
  viewCount?: number;
  wishlistCount?: number;
  category?: ListingCategory;
  user?: ListingUser;
}

interface ListingsFilter {
  categoryId?: string;
  status?: string;
  search?: string;
  priceMinMinor?: number;
  priceMaxMinor?: number;
  province?: string;
  city?: string;
  listingType?: string;
  sort?: string;
  specs?: Record<string, any>;
}

interface ListingsState {
  listings: Listing[];
  featuredListings: Listing[];
  currentListing: Listing | null;
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  hasMore: boolean;
  isInitialized: boolean;
  currentFilter: ListingsFilter; // Store current filter for pagination

  // Actions
  fetchListings: (filter?: ListingsFilter, page?: number) => Promise<void>;
  fetchFeaturedListings: (categorySlug?: string, limit?: number) => Promise<void>;
  fetchListingById: (id: string) => Promise<void>;
  loadMoreListings: () => Promise<void>;
  clearListings: () => void;
  clearError: () => void;
}

const PAGE_SIZE = 20;

// Cache duration: 2 minutes for listings
const LISTINGS_CACHE_TTL = 2 * 60 * 1000;
// Cache duration: 5 minutes for featured
const FEATURED_CACHE_TTL = 5 * 60 * 1000;

// ============================================================
// STORE
// ============================================================

export const useListingsStore = create<ListingsState>((set, get) => ({
  listings: [],
  featuredListings: [],
  currentListing: null,
  isLoading: false,
  error: null,
  totalResults: 0,
  currentPage: 1,
  hasMore: true,
  isInitialized: false,
  currentFilter: {},

  fetchListings: async (filter: ListingsFilter = {}, page: number = 1) => {
    // Store filter for pagination (only on first page)
    if (page === 1) {
      set({ currentFilter: filter });
    }
    set({ isLoading: true, error: null });

    try {
      const offset = (page - 1) * PAGE_SIZE;

      const graphqlFilter: any = {
        status: 'ACTIVE',
        ...filter,
      };

      const data = await cachedGraphqlRequest<{
        listingsSearch: any[];
        listingsAggregations: { totalResults: number };
      }>(
        LISTINGS_GRID_QUERY,
        {
          filter: graphqlFilter,
          limit: PAGE_SIZE,
          offset,
        },
        LISTINGS_CACHE_TTL
      );

      const listings = (data.listingsSearch || []).map(parseListingResponse);
      const totalResults = data.listingsAggregations?.totalResults || 0;
      const hasMore = offset + listings.length < totalResults;

      if (page === 1) {
        set({
          listings,
          totalResults,
          currentPage: page,
          hasMore,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        // Append for pagination
        const existingListings = get().listings;
        set({
          listings: [...existingListings, ...listings],
          currentPage: page,
          hasMore,
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to load listings',
      });
    }
  },

  fetchFeaturedListings: async (categorySlug?: string, limit: number = 10) => {
    try {
      // Build filter object matching web frontend pattern
      const filter: any = {
        status: 'ACTIVE',
      };

      if (categorySlug) {
        filter.categoryId = categorySlug;
      }

      const data = await cachedGraphqlRequest<{
        listingsSearch: any[];
      }>(
        FEATURED_LISTINGS_QUERY,
        { filter, limit },
        FEATURED_CACHE_TTL
      );

      const featuredListings = (data.listingsSearch || []).map(parseListingResponse);
      set({ featuredListings });
    } catch (error: any) {
      console.error('Failed to fetch featured listings:', error);
    }
  },

  fetchListingById: async (id: string) => {
    set({ isLoading: true, error: null, currentListing: null });

    try {
      const data = await graphqlRequest<{
        listing: any;
      }>(LISTING_BY_ID_QUERY, { id });

      if (!data.listing) {
        throw new Error('Listing not found');
      }

      const listing = parseListingResponse(data.listing);
      set({ currentListing: listing, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch listing:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to load listing',
      });
    }
  },

  loadMoreListings: async () => {
    const { currentPage, hasMore, isLoading, currentFilter } = get();

    if (!hasMore || isLoading) return;

    // Use stored filter for pagination to maintain search/filter state
    await get().fetchListings(currentFilter, currentPage + 1);
  },

  clearListings: () => {
    set({
      listings: [],
      totalResults: 0,
      currentPage: 1,
      hasMore: true,
      currentFilter: {},
    });
  },

  clearError: () => set({ error: null }),
}));

// ============================================================
// HELPERS
// ============================================================

function parseListingResponse(item: any): Listing {
  let specs = {};
  try {
    specs = item.specs ? JSON.parse(item.specs) : {};
  } catch {
    specs = {};
  }

  let specsDisplay = {};
  try {
    specsDisplay = item.specsDisplay ? JSON.parse(item.specsDisplay) : {};
  } catch {
    specsDisplay = {};
  }

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    priceMinor: item.priceMinor,
    status: item.status,
    imageKeys: item.imageKeys || [],
    videoUrl: item.videoUrl,
    createdAt: item.createdAt,
    categoryId: item.categoryId,
    allowBidding: item.allowBidding,
    biddingStartPrice: item.biddingStartPrice,
    listingType: item.listingType,
    condition: item.condition,
    accountType: item.accountType,
    location: item.location,
    specs,
    specsDisplay,
    viewCount: item.viewCount,
    wishlistCount: item.wishlistCount,
    category: item.category,
    user: item.user,
  };
}

// ============================================================
// SELECTORS
// ============================================================

export const useListings = () => useListingsStore((state) => state.listings);
export const useFeaturedListings = () => useListingsStore((state) => state.featuredListings);
export const useCurrentListing = () => useListingsStore((state) => state.currentListing);
export const useListingsLoading = () => useListingsStore((state) => state.isLoading);

export default useListingsStore;
