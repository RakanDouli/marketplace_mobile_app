/**
 * Subscription Plans Store
 * Fetch and cache user subscription plans
 */

import { create } from 'zustand';
import { cachedGraphqlRequest } from '../../services/graphql/client';
import { GET_PUBLIC_SUBSCRIPTION_PLANS_QUERY } from './subscriptionPlansStore.gql';
import type { SubscriptionPlan } from './types';

// Cache duration: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

interface SubscriptionPlansState {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  fetchPublicPlans: () => Promise<void>;
  getPlanByAccountType: (accountType: string) => SubscriptionPlan | undefined;
  reset: () => void;
}

export const useSubscriptionPlansStore = create<SubscriptionPlansState>((set, get) => ({
  plans: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  fetchPublicPlans: async () => {
    const { isInitialized } = get();

    // Skip if already initialized
    if (isInitialized) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphqlRequest<{
        userSubscriptions: SubscriptionPlan[];
      }>(GET_PUBLIC_SUBSCRIPTION_PLANS_QUERY, {}, CACHE_TTL);

      const plans = data.userSubscriptions || [];

      // Sort by sortOrder
      plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sortOrder - b.sortOrder);

      set({
        plans,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
    } catch (error: any) {
      console.error('Failed to fetch subscription plans:', error);
      set({
        error: error.message || 'فشل في جلب خطط الاشتراك',
        isLoading: false,
        isInitialized: false,
      });
    }
  },

  getPlanByAccountType: (accountType: string) => {
    const { plans } = get();
    return plans.find((plan) => plan.accountType === accountType);
  },

  reset: () => set({ plans: [], error: null, isInitialized: false }),
}));

// Selectors
export const useSubscriptionPlans = () => useSubscriptionPlansStore((state) => state.plans);
export const useSubscriptionPlansLoading = () => useSubscriptionPlansStore((state) => state.isLoading);

export type { SubscriptionPlan } from './types';
export default useSubscriptionPlansStore;
