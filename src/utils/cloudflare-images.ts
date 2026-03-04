/**
 * Cloudflare Images utility functions for mobile app
 * Matches web frontend: marketplace-frontend/utils/cloudflare-images.ts
 */

import { ENV } from '../constants/env';

// Named variants configured in Cloudflare dashboard
// These map to pre-configured dimensions in Cloudflare
export type CloudflareVariant =
  | 'public'      // 1366x768 - default
  | 'card'        // 400x300 - grid view cards
  | 'small'       // 300x200 - list view
  | 'large'       // 800x600 - detail view
  | 'thumbnail'   // 150x150 - tiny previews, avatars
  | 'mobile'      // 360x270 - mobile optimized
  | 'tablet'      // 768x576 - tablet optimized
  | 'desktop'     // 1200x900 - desktop optimized
  | 'blur';       // blur placeholder

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
 * Uses 'thumbnail' variant (150x150) which exists in Cloudflare
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

// ============================================
// Utility functions exported from utils/index.ts
// ============================================

/**
 * Get image URL - handles various source types
 * @param src - Cloudflare ID, full URL, or null
 * @param variant - Cloudflare variant
 */
export function getImageUrl(
  src: string | null | undefined,
  variant: CloudflareVariant = 'card'
): string {
  if (!src) return '';
  return getCloudflareImageUrl(src, variant);
}

/**
 * Get placeholder URL for missing images
 */
export function getPlaceholderUrl(): string {
  return ''; // Return empty - component will show placeholder icon
}

/**
 * Optimize listing image with appropriate variant
 */
export function optimizeListingImage(
  imageId: string,
  viewMode: 'card' | 'small' | 'large' | 'thumbnail' | 'mobile' = 'card'
): string {
  return getCloudflareImageUrl(imageId, viewMode);
}

/**
 * Get all listing images as optimized URLs
 */
export function getListingImages(
  images: string[],
  variant: CloudflareVariant = 'card'
): string[] {
  return images.map(img => getCloudflareImageUrl(img, variant));
}

/**
 * Get avatar URL with appropriate size
 * Uses 'thumbnail' variant (150x150) which exists in Cloudflare
 */
export function getAvatarUrl(
  imageId: string | null | undefined
): string {
  if (!imageId) return '';
  return getCloudflareImageUrl(imageId, 'thumbnail');
}

/**
 * Get avatar with initials fallback
 * Returns the avatar URL if available, otherwise returns initials
 * Uses 'thumbnail' variant (150x150) which exists in Cloudflare
 */
export function getAvatarWithInitials(
  imageId: string | null | undefined,
  name: string
): { url: string; initials: string } {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    url: imageId ? getCloudflareImageUrl(imageId, 'thumbnail') : '',
    initials,
  };
}

/**
 * Create chat thumbnail URL (2x resolution for retina)
 */
export function createChatThumbnail(imageId: string): string {
  return getCloudflareImageUrl(imageId, 'thumbnail');
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: {
  uri: string;
  type?: string;
  size?: number;
}): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size && file.size > maxSize) {
    return { valid: false, error: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت' };
  }

  if (file.type && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم' };
  }

  return { valid: true };
}
