/**
 * Location Formatting Utilities
 *
 * Translates province/city names to Arabic for display.
 */

import { PROVINCE_LABELS, getLabel } from "../constants/metadata-labels";

export interface LocationData {
  province?: string;
  city?: string;
}

/**
 * Format location for display with Arabic translation
 *
 * @param location Location object with province and/or city
 * @returns Formatted Arabic location string
 *
 * Examples:
 * - { province: "damascus", city: "المزة" } → "المزة، دمشق"
 * - { province: "aleppo" } → "حلب"
 * - { city: "جرمانا" } → "جرمانا"
 */
export function formatLocation(location?: LocationData | null): string {
  if (!location) return "";

  const { city, province } = location;

  // Translate province to Arabic
  const provinceArabic = province ? getLabel(province, PROVINCE_LABELS) : "";

  // City is usually already in Arabic from backend
  // Format: "city، province" or just one of them
  if (city && provinceArabic) {
    return `${city}، ${provinceArabic}`;
  }

  return city || provinceArabic || "";
}

/**
 * Get province label only (translated)
 */
export function getProvinceLabel(province?: string | null): string {
  if (!province) return "";
  return getLabel(province, PROVINCE_LABELS);
}

/**
 * Format location from separate fields
 */
export function formatLocationFromFields(
  city?: string | null,
  province?: string | null
): string {
  return formatLocation({ city: city || undefined, province: province || undefined });
}
