/**
 * Wishlist Store - Manage user's favorite listings
 * COPIED FROM WEB FRONTEND - Matching exact pattern
 */

import { create } from 'zustand';
import { graphqlRequest, cachedGraphqlRequest, clearCacheEntry } from '../../services/graphql/client';
import {
  ADD_TO_WISHLIST_MUTATION,
  REMOVE_FROM_WISHLIST_MUTATION,
  MY_WISHLIST_QUERY,
} from './wishlistStore.gql';

// ============================================================
// TYPES
// ============================================================

export interface WishlistListing {
  id: string;
  title: string;
  priceMinor: number;
  status: string;
  imageKeys: string[];
  wishlistCount: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
  };
  user: {
    id: string;
    name: string | null;
    accountType: string;
    accountBadge: string;
    companyName: string | null;
    businessVerified: boolean;
  };
}

interface WishlistState {
  // State
  wishlistIds: Set<string>;
  listings: WishlistListing[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  loadMyWishlist: () => Promise<void>;
  addToWishlist: (listingId: string, isArchived?: boolean) => Promise<void>;
  removeFromWishlist: (listingId: string, isArchived?: boolean) => Promise<void>;
  toggleWishlist: (listingId: string, isArchived?: boolean) => Promise<void>;
  isInWishlist: (listingId: string) => boolean;
  clearError: () => void;
}

// Cache duration: 2 minutes for wishlist
const WISHLIST_CACHE_TTL = 2 * 60 * 1000;

// ============================================================
// STORE
// ============================================================

export const useWishlistStore = create<WishlistState>((set, get) => ({
  // Initial state
  wishlistIds: new Set<string>(),
  listings: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  /**
   * Load user's wishlist from backend
   */
  loadMyWishlist: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphqlRequest<{
        myWishlist: WishlistListing[];
      }>(MY_WISHLIST_QUERY, {}, WISHLIST_CACHE_TTL);

      const listings = data.myWishlist || [];
      const wishlistIds = new Set<string>(listings.map((l) => l.id));

      set({
        listings,
        wishlistIds,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error: any) {
      console.error('[Wishlist] Error loading wishlist:', error);
      set({
        error: error.message || 'فشل تحميل المفضلة',
        isLoading: false,
      });
    }
  },

  /**
   * Add listing to wishlist
   */
  addToWishlist: async (listingId: string, isArchived: boolean = false) => {
    // Optimistic update
    set((state) => ({
      wishlistIds: new Set([...state.wishlistIds, listingId]),
    }));

    try {
      await graphqlRequest(ADD_TO_WISHLIST_MUTATION, { listingId, isArchived });
      // Clear cache so next loadMyWishlist fetches fresh data
      clearCacheEntry(MY_WISHLIST_QUERY, {});
    } catch (error: any) {
      // Revert optimistic update on error
      set((state) => {
        const newWishlistIds = new Set(state.wishlistIds);
        newWishlistIds.delete(listingId);
        return { wishlistIds: newWishlistIds };
      });
      console.error('[Wishlist] Error adding to wishlist:', error);
      set({ error: error.message || 'فشل إضافة الإعلان إلى المفضلة' });
      throw error;
    }
  },

  /**
   * Remove listing from wishlist
   */
  removeFromWishlist: async (listingId: string, isArchived: boolean = false) => {
    // Optimistic update
    set((state) => {
      const newWishlistIds = new Set(state.wishlistIds);
      newWishlistIds.delete(listingId);
      return {
        wishlistIds: newWishlistIds,
        listings: state.listings.filter((l) => l.id !== listingId),
      };
    });

    try {
      await graphqlRequest(REMOVE_FROM_WISHLIST_MUTATION, { listingId, isArchived });
      // Clear cache so next loadMyWishlist fetches fresh data
      clearCacheEntry(MY_WISHLIST_QUERY, {});
    } catch (error: any) {
      // Revert optimistic update on error
      set((state) => ({
        wishlistIds: new Set([...state.wishlistIds, listingId]),
      }));
      console.error('[Wishlist] Error removing from wishlist:', error);
      set({ error: error.message || 'فشل إزالة الإعلان من المفضلة' });
      throw error;
    }
  },

  /**
   * Toggle wishlist (add if not in, remove if in)
   */
  toggleWishlist: async (listingId: string, isArchived: boolean = false) => {
    const { isInWishlist, addToWishlist, removeFromWishlist } = get();

    if (isInWishlist(listingId)) {
      await removeFromWishlist(listingId, isArchived);
    } else {
      await addToWishlist(listingId, isArchived);
    }
  },

  /**
   * Check if listing is in wishlist
   */
  isInWishlist: (listingId: string) => {
    return get().wishlistIds.has(listingId);
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));

// ============================================================
// SELECTORS
// ============================================================

export const useWishlistIds = () => useWishlistStore((state) => state.wishlistIds);
export const useWishlistListings = () => useWishlistStore((state) => state.listings);
export const useWishlistLoading = () => useWishlistStore((state) => state.isLoading);

export default useWishlistStore;
