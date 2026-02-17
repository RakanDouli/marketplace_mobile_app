/**
 * Cloudflare Images utility functions for mobile app
 * Matches web frontend: marketplace-frontend/services/cloudflare-images.ts
 */

import { ENV } from '../../constants/env';

// Named variants configured in Cloudflare dashboard
// These map to pre-configured dimensions in Cloudflare
export type CloudflareVariant =
  | 'public'      // 1366x768 - default
  | 'card'        // 400x300 - grid view cards
  | 'small'       // 300x200 - list view
  | 'large'       // 800x600 - detail view
  | 'thumbnail'   // 150x150 - tiny previews
  | 'mobile'      // 360x270 - mobile optimized
  | 'tablet'      // 768x576 - tablet optimized
  | 'desktop';    // 1200x900 - desktop optimized

// UUID pattern for detecting Cloudflare image IDs
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid Cloudflare image ID (UUID format)
 */
export function isCloudflareImageId(imageId: string): boolean {
  return UUID_PATTERN.test(imageId);
}

/**
 * Generate Cloudflare Images URL with named variant
 * Format: https://imagedelivery.net/{account_hash}/{image_id}/{variant}
 */
export function getCloudflareImageUrl(
  imageId: string,
  variant: CloudflareVariant = 'public'
): string {
  if (!imageId) {
    return '';
  }

  const domain = ENV.CLOUDFLARE_DOMAIN;
  const hash = ENV.CLOUDFLARE_ACCOUNT_HASH;

  if (!domain || !hash) {
    return '';
  }

  // If already a full URL, return as-is
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    // If it's a Cloudflare URL, update the variant
    if (imageId.includes('imagedelivery.net')) {
      const parts = imageId.split('/');
      parts[parts.length - 1] = variant;
      return parts.join('/');
    }
    return imageId;
  }

  // Build URL with named variant
  return `https://${domain}/${hash}/${imageId}/${variant}`;
}

/**
 * Get optimized listing image URL
 * @param imageId - Cloudflare image ID or full URL
 * @param size - Predefined size variant
 */
export function getListingImageUrl(
  imageId: string,
  size: 'thumbnail' | 'card' | 'small' | 'large' | 'mobile' | 'public' = 'card'
): string {
  return getCloudflareImageUrl(imageId, size);
}

/**
 * Get optimized avatar image URL
 * @param imageId - Cloudflare image ID
 */
export function getAvatarImageUrl(imageId: string): string {
  return getCloudflareImageUrl(imageId, 'thumbnail');
}

/**
 * Get responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(imageId: string): {
  mobile: string;
  tablet: string;
  desktop: string;
} {
  return {
    mobile: getCloudflareImageUrl(imageId, 'mobile'),
    tablet: getCloudflareImageUrl(imageId, 'tablet'),
    desktop: getCloudflareImageUrl(imageId, 'desktop'),
  };
}
