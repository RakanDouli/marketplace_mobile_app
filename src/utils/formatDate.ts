/**
 * Date Formatting Utilities
 *
 * Dates are formatted with the current app locale (ar-EG or en-US)
 * based on the language setting in the language store.
 */

import { useLanguageStore } from "../stores/languageStore";

// Get the current locale from language store
const getLocale = (): string => {
  return useLanguageStore.getState().locale;
};

/**
 * Format date to full Arabic date
 *
 * Example: formatDate("2025-02-14") → "14 فبراير 2025"
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString(getLocale(), {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

/**
 * Format date to short format
 *
 * Example: formatDateShort("2025-02-14") → "14/02/2025"
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString(getLocale(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format date with time
 *
 * Example: formatDateTime("2025-02-14T15:30:00Z") → "14 فبراير 2025، 03:30 م"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleString(getLocale(), {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format day name only
 *
 * Example: formatDayName("2025-02-14") → "الجمعة"
 */
export function formatDayName(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString(getLocale(), {
    weekday: "long",
  });
}

/**
 * Format month and year only
 *
 * Example: formatMonthYear("2025-02-14") → "فبراير 2025"
 */
export function formatMonthYear(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString(getLocale(), {
    year: "numeric",
    month: "long",
  });
}

/**
 * Format time only
 *
 * Example: formatTime("2025-02-14T15:30:00Z") → "03:30 م"
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleTimeString(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format relative time (smart human-readable)
 *
 * Examples (Arabic):
 * - "منذ لحظات" (just now)
 * - "منذ 5 دقائق" (5 minutes ago)
 * - "منذ ساعتين" (2 hours ago)
 * - "منذ 3 أيام" (3 days ago)
 *
 * Examples (English):
 * - "just now"
 * - "5 minutes ago"
 * - "2 hours ago"
 * - "3 days ago"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  const isArabic = useLanguageStore.getState().language === 'ar';

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Future dates
  if (diffMs < 0) {
    return formatDate(dateObj);
  }

  // Just now
  if (diffSeconds < 60) {
    return isArabic ? "منذ لحظات" : "just now";
  }

  // Minutes
  if (diffMinutes < 60) {
    if (isArabic) {
      if (diffMinutes === 1) return "منذ دقيقة";
      if (diffMinutes === 2) return "منذ دقيقتين";
      if (diffMinutes <= 10) return `منذ ${diffMinutes} دقائق`;
      return `منذ ${diffMinutes} دقيقة`;
    } else {
      return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
    }
  }

  // Hours
  if (diffHours < 24) {
    if (isArabic) {
      if (diffHours === 1) return "منذ ساعة";
      if (diffHours === 2) return "منذ ساعتين";
      if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
      return `منذ ${diffHours} ساعة`;
    } else {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }
  }

  // Days
  if (diffDays < 7) {
    if (isArabic) {
      if (diffDays === 1) return "منذ يوم";
      if (diffDays === 2) return "منذ يومين";
      if (diffDays <= 10) return `منذ ${diffDays} أيام`;
      return `منذ ${diffDays} يوم`;
    } else {
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    }
  }

  // Weeks
  if (diffWeeks < 4) {
    if (isArabic) {
      if (diffWeeks === 1) return "منذ أسبوع";
      if (diffWeeks === 2) return "منذ أسبوعين";
      return `منذ ${diffWeeks} أسابيع`;
    } else {
      return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
    }
  }

  // Months
  if (diffMonths < 12) {
    if (isArabic) {
      if (diffMonths === 1) return "منذ شهر";
      if (diffMonths === 2) return "منذ شهرين";
      if (diffMonths <= 10) return `منذ ${diffMonths} أشهر`;
      return `منذ ${diffMonths} شهر`;
    } else {
      return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
    }
  }

  // Years
  if (isArabic) {
    if (diffYears === 1) return "منذ سنة";
    if (diffYears === 2) return "منذ سنتين";
    if (diffYears <= 10) return `منذ ${diffYears} سنوات`;
    return `منذ ${diffYears} سنة`;
  } else {
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
  }
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Format date for chat messages (smart display)
 *
 * Arabic:
 * - Today: "03:30 م"
 * - Yesterday: "الأمس، 03:30 م"
 * - This week: "الجمعة، 03:30 م"
 * - Older: "14 فبراير، 03:30 م"
 *
 * English:
 * - Today: "3:30 PM"
 * - Yesterday: "Yesterday, 3:30 PM"
 * - This week: "Friday, 3:30 PM"
 * - Older: "Feb 14, 3:30 PM"
 */
export function formatChatDate(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  const isArabic = useLanguageStore.getState().language === 'ar';
  const separator = isArabic ? "، " : ", ";
  const time = formatTime(dateObj);

  if (isToday(dateObj)) {
    return time;
  }

  if (isYesterday(dateObj)) {
    const yesterday = isArabic ? "الأمس" : "Yesterday";
    return `${yesterday}${separator}${time}`;
  }

  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 7) {
    const dayName = formatDayName(dateObj);
    return `${dayName}${separator}${time}`;
  }

  return `${formatDate(dateObj, { month: "short", day: "numeric" })}${separator}${time}`;
}
