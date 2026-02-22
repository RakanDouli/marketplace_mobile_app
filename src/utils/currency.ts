/**
 * Currency conversion utilities for price filtering
 * Supports USD, SYP, EUR only
 * ADAPTED FROM WEB FRONTEND
 */

import { graphqlRequest } from '../services/graphql/client';

// Supported currencies
export type Currency = 'USD' | 'SYP' | 'EUR';

export const CURRENCIES: Currency[] = ['USD', 'SYP', 'EUR'];

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'USD ($) - الدولار الأمريكي',
  SYP: 'SYP (S£) - الليرة السورية',
  EUR: 'EUR (€) - اليورو',
};

// GraphQL query to convert currency
const CONVERT_CURRENCY_QUERY = `
  query ConvertCurrency($amount: Float!, $from: String!, $to: String!) {
    convertCurrency(amount: $amount, from: $from, to: $to)
  }
`;

/**
 * Convert price amount from any currency to USD (for backend filtering)
 * Uses backend GraphQL endpoint for accurate conversion rates
 * @param amount - Amount in source currency
 * @param fromCurrency - Source currency
 * @returns Amount in USD
 */
export async function convertToUSD(
  amount: number,
  fromCurrency: Currency
): Promise<number> {
  if (fromCurrency === 'USD') return amount;

  try {
    const data = await graphqlRequest<{ convertCurrency: number }>(
      CONVERT_CURRENCY_QUERY,
      {
        amount,
        from: fromCurrency,
        to: 'USD',
      }
    );
    return Math.round(data.convertCurrency);
  } catch (error) {
    console.error('Failed to convert currency:', error);
    // Fallback: use approximate rates if API fails
    // Note: Syria redenominated currency in 2024 (removed 2 zeros)
    const fallbackRates: Record<string, number> = {
      SYP_USD: 0.00877,  // 1/114 (post-2024 redenomination)
      EUR_USD: 1.09,
    };
    const key = `${fromCurrency}_USD`;
    const rate = fallbackRates[key] || 1;
    return Math.round(amount * rate);
  }
}

/**
 * Parse price input (returns whole number)
 */
export function parsePrice(priceString: string): number {
  const parsed = parseFloat(priceString);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed);
}
