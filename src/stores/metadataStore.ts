/**
 * Metadata Store - Centralized Enum Values from Backend
 *
 * Purpose: Fetch and cache dropdown options from backend
 * Usage: const { listingStatuses } = useMetadataStore();
 *        const options = mapToOptions(listingStatuses, LISTING_STATUS_LABELS);
 */

import { create } from "zustand";
import { graphqlRequest } from "../services/graphql/client";

// ============================================================
// GRAPHQL QUERIES
// ============================================================

const GET_USER_METADATA = `
  query GetUserMetadata {
    getUserStatuses
    getUserRoles
    getAccountTypes
    getAccountBadges
  }
`;

const GET_LISTING_METADATA = `
  query GetListingMetadata {
    getListingStatuses
    getRejectionReasons
    getConditions
    getListingTypes
  }
`;

const GET_SUBSCRIPTION_METADATA = `
  query GetSubscriptionMetadata {
    getBillingCycles
    getSubscriptionStatuses
    getSubscriptionAccountTypes
  }
`;

const GET_AD_METADATA = `
  query GetAdMetadata {
    getAdMediaTypes
    getAdCampaignStatuses
    getAdClientStatuses
    getCampaignStartPreferences
    getAdPlacements
    getAdFormats
  }
`;

const GET_LOCATION_METADATA = `
  query GetLocationMetadata {
    getProvinces {
      key
      nameAr
    }
  }
`;

// ============================================================
// TYPES
// ============================================================

interface Province {
  key: string;
  nameAr: string;
}

interface MetadataState {
  // User & Account
  userStatuses: string[];
  userRoles: string[];
  accountTypes: string[];
  accountBadges: string[];

  // Listing
  listingStatuses: string[];
  rejectionReasons: string[];
  conditions: string[];
  listingTypes: string[];

  // Subscription
  billingCycles: string[];
  subscriptionStatuses: string[];
  subscriptionAccountTypes: string[];

  // Ad System
  adMediaTypes: string[];
  adCampaignStatuses: string[];
  adClientStatuses: string[];
  campaignStartPreferences: string[];
  adPlacements: string[];
  adFormats: string[];

  // Location
  provinces: Province[];

  // Loading states
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchAllMetadata: () => Promise<void>;
  fetchUserMetadata: () => Promise<void>;
  fetchListingMetadata: () => Promise<void>;
  fetchSubscriptionMetadata: () => Promise<void>;
  fetchAdMetadata: () => Promise<void>;
  fetchLocationMetadata: () => Promise<void>;
  clearError: () => void;
}

// Cache duration: 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;

// ============================================================
// STORE
// ============================================================

export const useMetadataStore = create<MetadataState>((set, get) => ({
  // Initial state
  userStatuses: [],
  userRoles: [],
  accountTypes: [],
  accountBadges: [],
  listingStatuses: [],
  rejectionReasons: [],
  conditions: [],
  listingTypes: [],
  billingCycles: [],
  subscriptionStatuses: [],
  subscriptionAccountTypes: [],
  adMediaTypes: [],
  adCampaignStatuses: [],
  adClientStatuses: [],
  campaignStartPreferences: [],
  adPlacements: [],
  adFormats: [],
  provinces: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  // Fetch all metadata at once
  fetchAllMetadata: async () => {
    const state = get();

    // Check cache
    if (
      state.lastFetched &&
      Date.now() - state.lastFetched < CACHE_DURATION &&
      state.userStatuses.length > 0
    ) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Fetch all in parallel
      await Promise.all([
        get().fetchUserMetadata(),
        get().fetchListingMetadata(),
        get().fetchLocationMetadata(),
      ]);

      set({ lastFetched: Date.now() });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch metadata" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch user-related metadata
  fetchUserMetadata: async () => {
    try {
      const data = await graphqlRequest<{
        getUserStatuses: string[];
        getUserRoles: string[];
        getAccountTypes: string[];
        getAccountBadges: string[];
      }>(GET_USER_METADATA);

      set({
        userStatuses: data.getUserStatuses || [],
        userRoles: data.getUserRoles || [],
        accountTypes: data.getAccountTypes || [],
        accountBadges: data.getAccountBadges || [],
      });
    } catch (error) {
      console.error("Failed to fetch user metadata:", error);
    }
  },

  // Fetch listing-related metadata
  fetchListingMetadata: async () => {
    try {
      const data = await graphqlRequest<{
        getListingStatuses: string[];
        getRejectionReasons: string[];
        getConditions: string[];
        getListingTypes: string[];
      }>(GET_LISTING_METADATA);

      set({
        listingStatuses: data.getListingStatuses || [],
        rejectionReasons: data.getRejectionReasons || [],
        conditions: data.getConditions || [],
        listingTypes: data.getListingTypes || [],
      });
    } catch (error) {
      console.error("Failed to fetch listing metadata:", error);
    }
  },

  // Fetch subscription-related metadata
  fetchSubscriptionMetadata: async () => {
    try {
      const data = await graphqlRequest<{
        getBillingCycles: string[];
        getSubscriptionStatuses: string[];
        getSubscriptionAccountTypes: string[];
      }>(GET_SUBSCRIPTION_METADATA);

      set({
        billingCycles: data.getBillingCycles || [],
        subscriptionStatuses: data.getSubscriptionStatuses || [],
        subscriptionAccountTypes: data.getSubscriptionAccountTypes || [],
      });
    } catch (error) {
      console.error("Failed to fetch subscription metadata:", error);
    }
  },

  // Fetch ad-related metadata
  fetchAdMetadata: async () => {
    try {
      const data = await graphqlRequest<{
        getAdMediaTypes: string[];
        getAdCampaignStatuses: string[];
        getAdClientStatuses: string[];
        getCampaignStartPreferences: string[];
        getAdPlacements: string[];
        getAdFormats: string[];
      }>(GET_AD_METADATA);

      set({
        adMediaTypes: data.getAdMediaTypes || [],
        adCampaignStatuses: data.getAdCampaignStatuses || [],
        adClientStatuses: data.getAdClientStatuses || [],
        campaignStartPreferences: data.getCampaignStartPreferences || [],
        adPlacements: data.getAdPlacements || [],
        adFormats: data.getAdFormats || [],
      });
    } catch (error) {
      console.error("Failed to fetch ad metadata:", error);
    }
  },

  // Fetch location metadata (provinces)
  fetchLocationMetadata: async () => {
    try {
      const data = await graphqlRequest<{
        getProvinces: Province[];
      }>(GET_LOCATION_METADATA);

      set({
        provinces: data.getProvinces || [],
      });
    } catch (error) {
      console.error("Failed to fetch location metadata:", error);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useMetadataStore;
