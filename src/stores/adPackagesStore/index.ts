/**
 * Ad Packages Store
 * Fetch and cache ad packages available for businesses to purchase
 */

import { create } from 'zustand';
import { cachedGraphqlRequest } from '../../services/graphql/client';
import { GET_ACTIVE_AD_PACKAGES_QUERY } from './adPackagesStore.gql';
import type { AdPackage } from './types';

// Cache duration: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

interface AdPackagesState {
  packages: AdPackage[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  fetchActivePackages: () => Promise<void>;
  getPackageById: (id: string) => AdPackage | undefined;
  reset: () => void;
}

export const useAdPackagesStore = create<AdPackagesState>((set, get) => ({
  packages: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  fetchActivePackages: async () => {
    const { isInitialized } = get();

    // Skip if already initialized
    if (isInitialized) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphqlRequest<{
        activeAdPackages: AdPackage[];
      }>(GET_ACTIVE_AD_PACKAGES_QUERY, {}, CACHE_TTL);

      const packages = data.activeAdPackages || [];

      // Sort by basePrice DESC (most expensive first)
      packages.sort((a: AdPackage, b: AdPackage) => b.basePrice - a.basePrice);

      set({
        packages,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
    } catch (error: any) {
      console.error('Failed to fetch ad packages:', error);
      set({
        error: error.message || 'فشل في جلب حزم الإعلانات',
        isLoading: false,
        isInitialized: false,
      });
    }
  },

  getPackageById: (id: string) => {
    const { packages } = get();
    return packages.find((pkg) => pkg.id === id);
  },

  reset: () => set({ packages: [], error: null, isInitialized: false }),
}));

// Selectors
export const useAdPackages = () => useAdPackagesStore((state) => state.packages);
export const useAdPackagesLoading = () => useAdPackagesStore((state) => state.isLoading);

export type { AdPackage, AdDimensions } from './types';
export default useAdPackagesStore;
