/**
 * Currency Store
 * Manages user's preferred currency for price display
 * Matches web frontend implementation
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../constants/env';

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

async function fetchRate(from: Currency, to: Currency): Promise<number> {
  try {
    const response = await fetch(ENV.GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetExchangeRate($from: String!, $to: String!) {
            getExchangeRate(from: $from, to: $to)
          }
        `,
        variables: { from, to },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      return 1;
    }

    return result.data.getExchangeRate;
  } catch (error) {
    return 1;
  }
}

interface CurrencyState {
  preferredCurrency: Currency;
  exchangeRates: Record<string, number>;
  isLoading: boolean;
  lastUpdated: Date | null;

  setPreferredCurrency: (currency: Currency) => Promise<void>;
  loadPreferredCurrency: () => Promise<void>;
  fetchExchangeRates: () => Promise<void>;
  getRate: (from: Currency, to: Currency) => number;
  convertPrice: (amountUSD: number, toCurrency?: Currency) => number;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  preferredCurrency: 'USD',
  exchangeRates: {
    // Fallback rates - will be updated from API
    // These are approximate and used if API fails
    // Note: Syria redenominated currency in 2024 (removed 2 zeros)
    USD_USD: 1,
    EUR_EUR: 1,
    SYP_SYP: 1,
    USD_EUR: 0.92,
    USD_SYP: 114,      // New SYP rate (post-2024 redenomination)
    EUR_USD: 1.09,
    EUR_SYP: 124,      // New SYP rate (post-2024 redenomination)
    SYP_USD: 0.00877,
    SYP_EUR: 0.00806,
  },
  isLoading: true,
  lastUpdated: null,

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

  fetchExchangeRates: async () => {
    try {
      const currencies: Currency[] = ['USD', 'EUR', 'SYP'];
      const currentRates = get().exchangeRates; // Keep fallback rates
      const rates: Record<string, number> = { ...currentRates }; // Start with existing rates

      const ratePromises: Promise<void>[] = [];

      for (const from of currencies) {
        for (const to of currencies) {
          if (from === to) {
            rates[`${from}_${to}`] = 1;
          } else {
            ratePromises.push(
              fetchRate(from, to).then(rate => {
                // Only update if we got a valid rate (not fallback 1)
                // Keep existing rate if API returned 1 (likely error)
                if (rate !== 1 || !currentRates[`${from}_${to}`]) {
                  rates[`${from}_${to}`] = rate;
                }
              })
            );
          }
        }
      }

      await Promise.all(ratePromises);

      // Only update if we have meaningful rates
      const hasValidSypRate = rates['USD_SYP'] && rates['USD_SYP'] > 100;
      if (hasValidSypRate) {
        set({ exchangeRates: rates, lastUpdated: new Date() });
      }
      // Otherwise keep fallback rates
    } catch (error) {
      // Silently fail - rates will remain at fallback values
      console.log('[CurrencyStore] Failed to fetch exchange rates, using fallbacks');
    }
  },

  getRate: (from, to) => {
    if (from === to) return 1;
    const key = `${from}_${to}`;
    return get().exchangeRates[key] || 1;
  },

  convertPrice: (amountUSD, toCurrency) => {
    const currency = toCurrency || get().preferredCurrency;
    const rate = get().getRate('USD', currency);
    return Math.round(amountUSD * rate);
  },
}));

export default useCurrencyStore;
