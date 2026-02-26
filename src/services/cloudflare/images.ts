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

/**
 * Get optimal variant based on screen width
 * Used for gallery images, preview modals, and detail pages
 * @param screenWidth - Current screen width in pixels
 * @param usage - What the image is used for
 */
export function getResponsiveVariant(
  screenWidth: number,
  usage: 'gallery' | 'preview' | 'card' | 'thumbnail' = 'gallery'
): CloudflareVariant {
  // Tablet threshold: 768px (standard tablet width)
  const isTablet = screenWidth >= 768;

  switch (usage) {
    case 'gallery':
      // Detail page gallery: tablet gets desktop quality, phone gets large
      return isTablet ? 'desktop' : 'large';
    case 'preview':
      // Full screen preview: tablet gets public (full), phone gets desktop
      return isTablet ? 'public' : 'desktop';
    case 'card':
      // Card grids: tablet gets card (400x300), phone gets mobile (360x270)
      return isTablet ? 'card' : 'mobile';
    case 'thumbnail':
      // Small thumbnails: tablet gets small (300x200), phone gets thumbnail (150x150)
      return isTablet ? 'small' : 'thumbnail';
    default:
      return 'large';
  }
}

/**
 * Get Cloudflare image URL with responsive variant
 * Automatically selects best variant based on screen width
 */
export function getResponsiveImageUrl(
  imageId: string,
  screenWidth: number,
  usage: 'gallery' | 'preview' | 'card' | 'thumbnail' = 'gallery'
): string {
  const variant = getResponsiveVariant(screenWidth, usage);
  return getCloudflareImageUrl(imageId, variant);
}
