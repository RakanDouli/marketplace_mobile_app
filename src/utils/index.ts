/**
 * Utility Exports
 */

// Price formatting
export {
  formatPrice,
  formatPriceRange,
  formatDualPrice,
  parsePrice,
  formatNumberWithCommas,
  parseFormattedNumber,
  convertPrice,
  setExchangeRates,
  setPreferredCurrency,
  getPreferredCurrency,
} from "./formatPrice";
export type { Currency } from "./formatPrice";

// Date formatting
export {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatDayName,
  formatMonthYear,
  formatTime,
  formatRelativeTime,
  formatChatDate,
  isToday,
  isYesterday,
} from "./formatDate";

// Image utilities
export {
  getImageUrl,
  getPlaceholderUrl,
  optimizeListingImage,
  getListingImages,
  getAvatarUrl,
  getAvatarWithInitials,
  createChatThumbnail,
  validateImageFile,
} from "./cloudflare-images";

// Location formatting
export {
  formatLocation,
  getProvinceLabel,
  formatLocationFromFields,
} from "./formatLocation";
export type { LocationData } from "./formatLocation";
