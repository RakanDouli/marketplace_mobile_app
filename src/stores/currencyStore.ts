/**
 * Currency Store
 * Manages user's preferred currency for price display
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Currency types
export type Currency = 'USD' | 'EUR' | 'SYP';

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  SYP: 'ل.س',
};

// Currency labels in Arabic
export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'دولار أمريكي',
  EUR: 'يورو',
  SYP: 'ليرة سورية',
};

// Storage key
const CURRENCY_STORAGE_KEY = 'preferred_currency';

interface CurrencyState {
  preferredCurrency: Currency;
  isLoading: boolean;
  setPreferredCurrency: (currency: Currency) => Promise<void>;
  loadPreferredCurrency: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  preferredCurrency: 'USD',
  isLoading: true,

  setPreferredCurrency: async (currency: Currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency);
      set({ preferredCurrency: currency });
    } catch (error) {
      console.error('Failed to save preferred currency:', error);
    }
  },

  loadPreferredCurrency: async () => {
    try {
      const stored = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored && (stored === 'USD' || stored === 'EUR' || stored === 'SYP')) {
        set({ preferredCurrency: stored as Currency, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load preferred currency:', error);
      set({ isLoading: false });
    }
  },
}));

export default useCurrencyStore;
