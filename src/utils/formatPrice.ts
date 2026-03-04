/**
 * Price Formatting Utilities
 *
 * All prices are stored in USD in the database.
 * This utility converts and formats prices for display.
 *
 * IMPORTANT: This utility uses the currencyStore for exchange rates.
 * Do NOT use hardcoded rates here - always get rates from the store.
 */

import { CURRENCY_SYMBOLS } from "../constants/metadata-labels";
import { useCurrencyStore } from "../stores/currencyStore";

export type Currency = "USD" | "SYP" | "EUR";

/**
 * Convert price from USD to target currency
 * Uses rates from currencyStore for consistency
 */
export function convertPrice(
  priceUSD: number,
  toCurrency: Currency
): number {
  if (toCurrency === "USD") return priceUSD;

  // Get rate from the store (single source of truth)
  const rate = useCurrencyStore.getState().getRate("USD", toCurrency);
  return Math.round(priceUSD * rate);
}

/**
 * Format price with currency symbol and thousands separators
 *
 * @param price Price in USD (as stored in database)
 * @param currency Target currency for display (default: preferredCurrency from store)
 * @returns Formatted price string with currency symbol
 *
 * Examples:
 * - formatPrice(500) → "$500" (if USD)
 * - formatPrice(500, "SYP") → "6,500,000 ل.س"
 * - formatPrice(500, "EUR") → "€460"
 */
export function formatPrice(
  price: number | null | undefined,
  currency?: Currency
): string {
  // Get preferred currency from store if not provided
  const targetCurrency = currency || useCurrencyStore.getState().preferredCurrency;

  // Handle null/undefined/NaN
  if (price === null || price === undefined || isNaN(price)) {
    return formatPriceValue(0, targetCurrency);
  }

  const convertedPrice = convertPrice(price, targetCurrency);

  return formatPriceValue(convertedPrice, targetCurrency);
}

/**
 * Format a price value with currency symbol
 * (Internal helper - assumes price is already in target currency)
 */
function formatPriceValue(price: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  // Format with thousands separators
  const formatted = price.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  });

  // Symbol position: before for USD/EUR, after for SYP
  if (currency === "SYP") {
    return `${formatted} ${symbol}`;
  }

  return `${symbol}${formatted}`;
}

/**
 * Format price range (e.g., for filters)
 *
 * Example: formatPriceRange(100, 500) → "$100 - $500"
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  currency?: Currency
): string {
  const min = formatPrice(minPrice, currency);
  const max = formatPrice(maxPrice, currency);
  return `${min} - ${max}`;
}

/**
 * Format price with both USD and SYP
 * Useful for showing both currencies side by side
 *
 * Example: formatDualPrice(500) → { usd: "$500", syp: "6,500,000 ل.س" }
 */
export function formatDualPrice(priceUSD: number): {
  usd: string;
  syp: string;
} {
  return {
    usd: formatPrice(priceUSD, "USD"),
    syp: formatPrice(priceUSD, "SYP"),
  };
}

/**
 * Parse formatted price string back to number
 * Useful for form inputs
 *
 * Example: parsePrice("$5,000") → 5000
 */
export function parsePrice(formattedPrice: string): number {
  // Remove currency symbols and separators
  const cleaned = formattedPrice
    .replace(/[$€ل.س]/g, "")
    .replace(/,/g, "")
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

/**
 * Format number with thousands separators (no currency)
 *
 * Example: formatNumberWithCommas(5000) → "5,000"
 */
export function formatNumberWithCommas(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;

  if (isNaN(num)) return "";

  return Math.round(num).toLocaleString("en-US");
}

/**
 * Parse formatted number back to number
 *
 * Example: parseFormattedNumber("5,000") → 5000
 */
export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}
