/**
 * Listing Owner Store
 * Fetches and caches seller/owner information for listing detail page
 */

import { create } from 'zustand';
import { graphqlRequest } from '../services/graphql/client';

// GraphQL query for owner info (matches web frontend - userById query)
const GET_LISTING_OWNER_QUERY = `
  query GetOwnerData($userId: ID!) {
    userById(id: $userId) {
      id
      name
      email
      phone
      contactPhone
      showPhone
      showContactPhone
      phoneIsWhatsApp
      avatar
      accountType
      companyName
      companyRegistrationNumber
      businessVerified
      createdAt
      averageRating
      reviewCount
    }
  }
`;

export interface ListingOwner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contactPhone?: string;
  showPhone?: boolean;
  showContactPhone?: boolean;
  phoneIsWhatsApp?: boolean;
  avatar?: string;
  accountType: 'individual' | 'business' | 'dealer';
  companyName?: string;
  companyRegistrationNumber?: string;
  businessVerified?: boolean;
  createdAt: string;
  averageRating?: number;
  reviewCount?: number;
}

interface ListingOwnerState {
  owner: ListingOwner | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedUserId: string | null;
  lastFetchedAt: number | null;

  fetchOwner: (userId: string) => Promise<void>;
  clearOwner: () => void;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useListingOwnerStore = create<ListingOwnerState>((set, get) => ({
  owner: null,
  isLoading: false,
  error: null,
  lastFetchedUserId: null,
  lastFetchedAt: null,

  fetchOwner: async (userId: string) => {
    const state = get();

    // Check cache - if same user and within cache duration, skip fetch
    if (
      state.lastFetchedUserId === userId &&
      state.lastFetchedAt &&
      Date.now() - state.lastFetchedAt < CACHE_DURATION &&
      state.owner
    ) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await graphqlRequest<{ userById: ListingOwner }>(
        GET_LISTING_OWNER_QUERY,
        { userId }
      );

      set({
        owner: result.userById,
        isLoading: false,
        lastFetchedUserId: userId,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      console.error('[listingOwnerStore] Error fetching owner:', error);
      set({
        error: 'فشل تحميل معلومات البائع',
        isLoading: false,
      });
    }
  },

  clearOwner: () => {
    set({
      owner: null,
      lastFetchedUserId: null,
      lastFetchedAt: null,
    });
  },
}));
