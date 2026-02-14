/**
 * Date Formatting Utilities
 *
 * All dates are formatted with Arabic locale (ar-EG)
 * for proper Arabic month names and number formatting.
 */

const ARABIC_LOCALE = "ar-EG";

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

  return dateObj.toLocaleDateString(ARABIC_LOCALE, {
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

  return dateObj.toLocaleDateString(ARABIC_LOCALE, {
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

  return dateObj.toLocaleString(ARABIC_LOCALE, {
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

  return dateObj.toLocaleDateString(ARABIC_LOCALE, {
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

  return dateObj.toLocaleDateString(ARABIC_LOCALE, {
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

  return dateObj.toLocaleTimeString(ARABIC_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format relative time (smart human-readable)
 *
 * Examples:
 * - "منذ لحظات" (just now)
 * - "منذ 5 دقائق" (5 minutes ago)
 * - "منذ ساعتين" (2 hours ago)
 * - "منذ 3 أيام" (3 days ago)
 * - "منذ أسبوع" (a week ago)
 * - "منذ شهر" (a month ago)
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

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
    return "منذ لحظات";
  }

  // Minutes
  if (diffMinutes < 60) {
    if (diffMinutes === 1) return "منذ دقيقة";
    if (diffMinutes === 2) return "منذ دقيقتين";
    if (diffMinutes <= 10) return `منذ ${diffMinutes} دقائق`;
    return `منذ ${diffMinutes} دقيقة`;
  }

  // Hours
  if (diffHours < 24) {
    if (diffHours === 1) return "منذ ساعة";
    if (diffHours === 2) return "منذ ساعتين";
    if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
    return `منذ ${diffHours} ساعة`;
  }

  // Days
  if (diffDays < 7) {
    if (diffDays === 1) return "منذ يوم";
    if (diffDays === 2) return "منذ يومين";
    if (diffDays <= 10) return `منذ ${diffDays} أيام`;
    return `منذ ${diffDays} يوم`;
  }

  // Weeks
  if (diffWeeks < 4) {
    if (diffWeeks === 1) return "منذ أسبوع";
    if (diffWeeks === 2) return "منذ أسبوعين";
    return `منذ ${diffWeeks} أسابيع`;
  }

  // Months
  if (diffMonths < 12) {
    if (diffMonths === 1) return "منذ شهر";
    if (diffMonths === 2) return "منذ شهرين";
    if (diffMonths <= 10) return `منذ ${diffMonths} أشهر`;
    return `منذ ${diffMonths} شهر`;
  }

  // Years
  if (diffYears === 1) return "منذ سنة";
  if (diffYears === 2) return "منذ سنتين";
  if (diffYears <= 10) return `منذ ${diffYears} سنوات`;
  return `منذ ${diffYears} سنة`;
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
 * - Today: "03:30 م"
 * - Yesterday: "الأمس، 03:30 م"
 * - This week: "الجمعة، 03:30 م"
 * - Older: "14 فبراير، 03:30 م"
 */
export function formatChatDate(date: string | Date | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  const time = formatTime(dateObj);

  if (isToday(dateObj)) {
    return time;
  }

  if (isYesterday(dateObj)) {
    return `الأمس، ${time}`;
  }

  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 7) {
    const dayName = formatDayName(dateObj);
    return `${dayName}، ${time}`;
  }

  return `${formatDate(dateObj, { month: "short", day: "numeric" })}، ${time}`;
}
