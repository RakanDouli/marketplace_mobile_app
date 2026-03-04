/**
 * Listing Analytics Store
 * Manages analytics data for user's listings
 * Requires analyticsAccess permission from subscription
 */

import { create } from 'zustand';
import { graphqlRequest } from '../../services/graphql/client';
import {
  GET_MY_LISTING_ANALYTICS_QUERY,
  GET_MY_ANALYTICS_SUMMARY_QUERY,
} from './listingAnalyticsStore.gql';
import type { ListingAnalytics, AnalyticsSummary } from './types';
import { useUserAuthStore } from '../userAuthStore';

export type { ListingAnalytics, AnalyticsSummary, DailyViews, ListingPerformance } from './types';

interface ListingAnalyticsStore {
  // State
  listingAnalytics: ListingAnalytics | null;
  analyticsSummary: AnalyticsSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchListingAnalytics: (listingId: string, days?: number) => Promise<void>;
  fetchAnalyticsSummary: (days?: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useListingAnalyticsStore = create<ListingAnalyticsStore>((set) => ({
  // Initial state
  listingAnalytics: null,
  analyticsSummary: null,
  isLoading: false,
  error: null,

  // Fetch analytics for a specific listing
  fetchListingAnalytics: async (listingId: string, days = 30) => {
    // Check access at store level
    const { userPackage } = useUserAuthStore.getState();
    if (!userPackage?.userSubscription?.analyticsAccess) {
      set({ error: 'ليس لديك صلاحية الوصول إلى الإحصائيات' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await graphqlRequest<{
        getMyListingAnalytics: ListingAnalytics;
      }>(GET_MY_LISTING_ANALYTICS_QUERY, { listingId, days });

      set({
        listingAnalytics: data.getMyListingAnalytics,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'فشل في تحميل الإحصائيات',
        isLoading: false,
      });
    }
  },

  // Fetch analytics summary for all user's listings
  fetchAnalyticsSummary: async (days = 30) => {
    // Check access at store level
    const { userPackage } = useUserAuthStore.getState();
    if (!userPackage?.userSubscription?.analyticsAccess) {
      set({ error: 'ليس لديك صلاحية الوصول إلى الإحصائيات' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await graphqlRequest<{
        getMyAnalyticsSummary: AnalyticsSummary;
      }>(GET_MY_ANALYTICS_SUMMARY_QUERY, { days });

      set({
        analyticsSummary: data.getMyAnalyticsSummary,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'فشل في تحميل ملخص الإحصائيات',
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      listingAnalytics: null,
      analyticsSummary: null,
      isLoading: false,
      error: null,
    }),
}));
