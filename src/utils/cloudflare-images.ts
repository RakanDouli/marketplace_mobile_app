/**
 * Cloudflare Images Utilities
 *
 * Handles image URL generation for Cloudflare Images CDN.
 * All listing images are stored on Cloudflare and served via their CDN.
 */

import { ENV } from "../constants/env";

// Image variants defined in Cloudflare dashboard
type ImageVariant =
  | "public"      // Original size
  | "thumbnail"   // 150x150
  | "card"        // 400x300
  | "gallery"     // 800x600
  | "detail"      // 1200x900
  | "avatar"      // 128x128 circle
  | "avatar_lg"   // 256x256 circle
  | "chat";       // 64x64

/**
 * Generate Cloudflare image URL from image key
 *
 * @param imageKey The unique image identifier (stored in database)
 * @param variant The image variant/size to use
 * @returns Full Cloudflare image URL
 *
 * Example:
 * getImageUrl("abc123", "card")
 * → "https://imagedelivery.net/yvE6_nYkmBMTwQORcLcTkA/abc123/card"
 */
export function getImageUrl(
  imageKey: string | null | undefined,
  variant: ImageVariant = "public"
): string {
  if (!imageKey) {
    return getPlaceholderUrl(variant);
  }

  // If already a full URL, return as-is
  if (imageKey.startsWith("http")) {
    return imageKey;
  }

  return `https://${ENV.CLOUDFLARE_DOMAIN}/${ENV.CLOUDFLARE_ACCOUNT_HASH}/${imageKey}/${variant}`;
}

/**
 * Generate placeholder image URL based on variant
 */
export function getPlaceholderUrl(variant: ImageVariant = "public"): string {
  // Using a simple placeholder service
  const sizes: Record<ImageVariant, string> = {
    public: "800x600",
    thumbnail: "150x150",
    card: "400x300",
    gallery: "800x600",
    detail: "1200x900",
    avatar: "128x128",
    avatar_lg: "256x256",
    chat: "64x64",
  };

  const size = sizes[variant];
  return `https://via.placeholder.com/${size}/e2e8f0/64748b?text=No+Image`;
}

/**
 * Optimize listing image for card display
 *
 * @param imageKey Image key or array of keys
 * @returns Optimized URL for card display
 */
export function optimizeListingImage(
  imageKey: string | string[] | null | undefined
): string {
  if (!imageKey) {
    return getPlaceholderUrl("card");
  }

  // If array, use first image
  const key = Array.isArray(imageKey) ? imageKey[0] : imageKey;

  return getImageUrl(key, "card");
}

/**
 * Get all listing images with specified variant
 *
 * @param imageKeys Array of image keys
 * @param variant Image variant to use
 * @returns Array of image URLs
 */
export function getListingImages(
  imageKeys: string[] | null | undefined,
  variant: ImageVariant = "gallery"
): string[] {
  if (!imageKeys || imageKeys.length === 0) {
    return [getPlaceholderUrl(variant)];
  }

  return imageKeys.map((key) => getImageUrl(key, variant));
}

/**
 * Get user avatar URL
 *
 * @param avatarKey User's avatar image key
 * @param size Avatar size variant
 * @returns Avatar URL or default avatar
 */
export function getAvatarUrl(
  avatarKey: string | null | undefined,
  size: "avatar" | "avatar_lg" = "avatar"
): string {
  if (!avatarKey) {
    // Return default avatar
    return `https://ui-avatars.com/api/?background=3b82f6&color=fff&size=${
      size === "avatar" ? 128 : 256
    }&name=U`;
  }

  return getImageUrl(avatarKey, size);
}

/**
 * Get user avatar URL with initials fallback
 *
 * @param avatarKey User's avatar image key
 * @param name User's name for initials
 * @param size Avatar size variant
 * @returns Avatar URL
 */
export function getAvatarWithInitials(
  avatarKey: string | null | undefined,
  name: string | null | undefined,
  size: "avatar" | "avatar_lg" = "avatar"
): string {
  if (avatarKey) {
    return getImageUrl(avatarKey, size);
  }

  // Generate initials avatar
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return `https://ui-avatars.com/api/?background=3b82f6&color=fff&size=${
    size === "avatar" ? 128 : 256
  }&name=${encodeURIComponent(initials)}`;
}

/**
 * Create chat message thumbnail
 *
 * @param imageKey Image key
 * @returns Thumbnail URL for chat
 */
export function createChatThumbnail(
  imageKey: string | null | undefined
): string {
  return getImageUrl(imageKey, "chat");
}

/**
 * Validate image file for upload
 *
 * @param file File object or URI
 * @param maxSizeMB Maximum file size in MB
 * @returns Validation result
 */
export function validateImageFile(
  fileSize: number,
  fileType: string,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  // Check file size
  if (fileSize > maxBytes) {
    return {
      valid: false,
      error: `حجم الصورة يجب أن يكون أقل من ${maxSizeMB} ميجابايت`,
    };
  }

  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(fileType.toLowerCase())) {
    return {
      valid: false,
      error: "نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, WebP, GIF",
    };
  }

  return { valid: true };
}
