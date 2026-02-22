/**
 * Related Listings Store
 * Fetches related listings by brand or price range
 */

import { create } from 'zustand';
import { graphqlRequest } from '../services/graphql/client';

const GET_RELATED_LISTINGS_QUERY = `
  query GetRelatedListings($listingId: ID!, $type: String!, $limit: Int) {
    relatedListings(listingId: $listingId, type: $type, limit: $limit) {
      id
      title
      priceMinor
      listingType
      imageKeys
      location {
        province
        city
        area
      }
      specsDisplay
      category {
        slug
      }
    }
  }
`;

export interface RelatedListing {
  id: string;
  title: string;
  priceMinor: number;
  listingType: string;
  imageKeys: string[];
  location?: {
    province?: string;
    city?: string;
    area?: string;
  };
  specsDisplay?: Record<string, any>;
  category?: {
    slug: string;
  };
}

type RelationType = 'SAME_BRAND' | 'SIMILAR_PRICE';

interface RelatedListingsState {
  byBrand: RelatedListing[];
  byPrice: RelatedListing[];
  isLoadingBrand: boolean;
  isLoadingPrice: boolean;
  error: string | null;
  lastFetchedListingId: string | null;

  fetchRelatedByBrand: (listingId: string, limit?: number) => Promise<void>;
  fetchRelatedByPrice: (listingId: string, limit?: number) => Promise<void>;
  fetchAll: (listingId: string) => Promise<void>;
  clearRelated: () => void;
}

export const useRelatedListingsStore = create<RelatedListingsState>((set, get) => ({
  byBrand: [],
  byPrice: [],
  isLoadingBrand: false,
  isLoadingPrice: false,
  error: null,
  lastFetchedListingId: null,

  fetchRelatedByBrand: async (listingId: string, limit = 6) => {
    set({ isLoadingBrand: true });

    try {
      const result = await graphqlRequest<{ relatedListings: RelatedListing[] }>(
        GET_RELATED_LISTINGS_QUERY,
        { listingId, type: 'SAME_BRAND', limit }
      );

      set({
        byBrand: result.relatedListings || [],
        isLoadingBrand: false,
      });
    } catch (error) {
      console.error('[relatedListingsStore] Error fetching by brand:', error);
      set({ isLoadingBrand: false });
    }
  },

  fetchRelatedByPrice: async (listingId: string, limit = 6) => {
    set({ isLoadingPrice: true });

    try {
      const result = await graphqlRequest<{ relatedListings: RelatedListing[] }>(
        GET_RELATED_LISTINGS_QUERY,
        { listingId, type: 'SIMILAR_PRICE', limit }
      );

      set({
        byPrice: result.relatedListings || [],
        isLoadingPrice: false,
      });
    } catch (error) {
      console.error('[relatedListingsStore] Error fetching by price:', error);
      set({ isLoadingPrice: false });
    }
  },

  fetchAll: async (listingId: string) => {
    const state = get();

    // Skip if already fetched for this listing
    if (state.lastFetchedListingId === listingId) {
      return;
    }

    set({ lastFetchedListingId: listingId });

    // Fetch both in parallel
    await Promise.all([
      get().fetchRelatedByBrand(listingId),
      get().fetchRelatedByPrice(listingId),
    ]);
  },

  clearRelated: () => {
    set({
      byBrand: [],
      byPrice: [],
      lastFetchedListingId: null,
    });
  },
}));
