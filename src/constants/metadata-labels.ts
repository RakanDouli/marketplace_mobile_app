/**
 * Metadata Labels - Arabic Translations for Enums
 *
 * Usage:
 * 1. For dropdowns: mapToOptions(values, LABELS)
 * 2. For display: getLabel(value, LABELS)
 *
 * IMPORTANT: Keys must match backend enum values exactly
 */

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert enum values array to dropdown options
 * @param values Array of enum keys from metadataStore
 * @param labelMap Label mapping object
 * @returns Array of { value, label } for dropdowns/pickers
 */
export function mapToOptions(
  values: string[],
  labelMap: Record<string, string>
): Array<{ value: string; label: string }> {
  return values.map((value) => ({
    value,
    label: labelMap[value] || labelMap[value.toUpperCase()] || value,
  }));
}

/**
 * Get single label with case-insensitive fallback
 * @param value Enum value from backend
 * @param labelMap Label mapping object
 * @returns Arabic label or original value if not found
 */
export function getLabel(
  value: string | null | undefined,
  labelMap: Record<string, string>
): string {
  if (!value) return "";

  // Try exact match first
  if (labelMap[value]) return labelMap[value];

  // Try uppercase
  const uppercased = value.toUpperCase();
  if (labelMap[uppercased]) return labelMap[uppercased];

  // Try lowercase
  const lowercased = value.toLowerCase();
  if (labelMap[lowercased]) return labelMap[lowercased];

  // Try snake_case conversion (replace spaces with underscores, lowercase)
  const snakeCase = value.toLowerCase().replace(/\s+/g, '_');
  if (labelMap[snakeCase]) return labelMap[snakeCase];

  // Try removing underscores and matching
  const noUnderscores = value.toLowerCase().replace(/_/g, '');
  for (const key of Object.keys(labelMap)) {
    if (key.toLowerCase().replace(/_/g, '') === noUnderscores) {
      return labelMap[key];
    }
  }

  // Return original but replace underscores with spaces for display
  return value.replace(/_/g, ' ');
}

// ============================================================
// USER & ACCOUNT LABELS
// ============================================================

export const USER_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  active: "نشط",
  inactive: "غير نشط",
  suspended: "موقوف",
  banned: "محظور",
  // UPPERCASE versions (for flexibility)
  PENDING: "قيد الانتظار",
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  SUSPENDED: "موقوف",
  BANNED: "محظور",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: "فردي",
  dealer: "تاجر",
  business: "شركة",
  INDIVIDUAL: "فردي",
  DEALER: "تاجر",
  BUSINESS: "شركة",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  user: "مستخدم",
  editor: "محرر",
  admin: "مدير",
  super_admin: "مدير عام",
  USER: "مستخدم",
  EDITOR: "محرر",
  ADMIN: "مدير",
  SUPER_ADMIN: "مدير عام",
};

export const ACCOUNT_BADGE_LABELS: Record<string, string> = {
  none: "بدون شارة",
  verified: "موثق",
  premium: "مميز",
  NONE: "بدون شارة",
  VERIFIED: "موثق",
  PREMIUM: "مميز",
};

// ============================================================
// LISTING LABELS
// ============================================================

export const LISTING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING_APPROVAL: "قيد المراجعة",
  ACTIVE: "نشط",
  REJECTED: "مرفوض",
  HIDDEN: "مخفي",
  ARCHIVED: "مؤرشف",
  SOLD: "مباع",
  EXPIRED: "منتهي الصلاحية",
};

export const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: "للبيع",
  RENT: "للإيجار",
  sale: "للبيع",
  rent: "للإيجار",
};

export const CONDITION_LABELS: Record<string, string> = {
  // Lowercase keys match backend enum values exactly
  new: "جديد",
  used_like_new: "مستعمل كالجديد",
  used: "مستعمل",
  // Uppercase keys for flexibility
  NEW: "جديد",
  USED_LIKE_NEW: "مستعمل كالجديد",
  USED: "مستعمل",
};

export const REJECTION_REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE_CONTENT: "محتوى غير لائق",
  MISLEADING_INFORMATION: "معلومات مضللة",
  PROHIBITED_ITEM: "منتج محظور",
  DUPLICATE_LISTING: "إعلان مكرر",
  POOR_QUALITY_IMAGES: "صور رديئة الجودة",
  INCOMPLETE_INFORMATION: "معلومات ناقصة",
  PRICING_ISSUES: "مشاكل في التسعير",
  SPAM: "رسائل مزعجة",
  SCAM_SUSPECTED: "اشتباه في احتيال",
  OTHER: "أخرى",
};

// ============================================================
// SUBSCRIPTION LABELS
// ============================================================

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  FREE: "مجاني",
  MONTHLY: "شهري",
  YEARLY: "سنوي",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  expired: "منتهي",
  cancelled: "ملغي",
  pending: "قيد الانتظار",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
  PENDING: "قيد الانتظار",
};

// ============================================================
// AD SYSTEM LABELS
// ============================================================

export const AD_MEDIA_TYPE_LABELS: Record<string, string> = {
  image: "صورة",
  video: "فيديو",
  IMAGE: "صورة",
  VIDEO: "فيديو",
};

export const AD_CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  payment_sent: "تم إرسال رابط الدفع",
  paid: "مدفوعة",
  active: "نشطة",
  paused: "متوقفة مؤقتاً",
  completed: "مكتملة",
  cancelled: "ملغية",
  DRAFT: "مسودة",
  PAYMENT_SENT: "تم إرسال رابط الدفع",
  PAID: "مدفوعة",
  ACTIVE: "نشطة",
  PAUSED: "متوقفة مؤقتاً",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغية",
};

export const AD_PLACEMENT_LABELS: Record<string, string> = {
  homepage_top: "الصفحة الرئيسية - أعلى",
  homepage_mid: "الصفحة الرئيسية - وسط",
  between_listings: "بين الإعلانات",
  detail_top: "صفحة التفاصيل - أعلى",
  detail_before_description: "صفحة التفاصيل - قبل الوصف",
};

// ============================================================
// TRANSACTION LABELS
// ============================================================

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  completed: "مكتملة",
  failed: "فاشلة",
  refunded: "مستردة",
  PENDING: "قيد الانتظار",
  COMPLETED: "مكتملة",
  FAILED: "فاشلة",
  REFUNDED: "مستردة",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "بطاقة ائتمان",
  paypal: "باي بال",
  bank_transfer: "تحويل بنكي",
  cash: "نقداً",
};

// ============================================================
// REPORT LABELS
// ============================================================

export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  resolved: "تم الحل",
  dismissed: "مرفوض",
  in_review: "قيد المراجعة",
  escalated: "تم التصعيد",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  fraud: "احتيال",
  spam: "رسائل مزعجة",
  inappropriate: "محتوى غير لائق",
  harassment: "تحرش",
  fake_listing: "إعلان مزيف",
  wrong_category: "تصنيف خاطئ",
  duplicate: "إعلان مكرر",
  offensive: "محتوى مسيء",
  other: "أخرى",
};

// ============================================================
// LOCATION LABELS (Syrian Provinces)
// ============================================================

export const PROVINCE_LABELS: Record<string, string> = {
  damascus: "دمشق",
  rif_damascus: "ريف دمشق",
  aleppo: "حلب",
  homs: "حمص",
  hama: "حماة",
  latakia: "اللاذقية",
  tartous: "طرطوس",
  idlib: "إدلب",
  deir_ez_zor: "دير الزور",
  hasakah: "الحسكة",
  raqqa: "الرقة",
  sweida: "السويداء",
  daraa: "درعا",
  quneitra: "القنيطرة",
};

// ============================================================
// CAR FEATURES (Sample - Extend as needed)
// ============================================================

export const CAR_FEATURE_LABELS: Record<string, string> = {
  air_conditioning: "تكييف هواء",
  power_steering: "مقود كهربائي",
  power_windows: "نوافذ كهربائية",
  abs: "نظام ABS",
  airbags: "وسائد هوائية",
  cruise_control: "مثبت السرعة",
  leather_seats: "مقاعد جلدية",
  sunroof: "فتحة سقف",
  navigation: "نظام ملاحة",
  bluetooth: "بلوتوث",
  parking_sensors: "حساسات ركن",
  backup_camera: "كاميرا خلفية",
  heated_seats: "مقاعد مدفأة",
  keyless_entry: "دخول بدون مفتاح",
  push_start: "تشغيل بزر",
};

// ============================================================
// CURRENCY LABELS
// ============================================================

export const CURRENCY_LABELS: Record<string, string> = {
  USD: "الدولار الأمريكي ($)",
  SYP: "الليرة السورية (ل.س)",
  EUR: "اليورو (€)",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  SYP: "ل.س",
  EUR: "€",
};

// ============================================================
// WARNING MESSAGE TRANSLATION
// ============================================================

/**
 * Translate warning messages from backend to Arabic
 * Backend sends messages like: "AI detected prohibited content in listing: inappropriate_images or sensitive content"
 */
export function translateWarningMessage(message: string | null | undefined): string {
  if (!message) return '';

  // Pattern: "AI detected prohibited content in listing: {reason}"
  const aiDetectedMatch = message.match(/AI detected prohibited content in listing:\s*(.+)/i);
  if (aiDetectedMatch) {
    const reason = aiDetectedMatch[1].trim();
    // Try to translate the reason
    const translatedReason = translateRejectionReason(reason);
    return `تم اكتشاف محتوى مخالف في إعلانك: ${translatedReason}`;
  }

  // Other common patterns
  const patterns: Record<string, string> = {
    'inappropriate content': 'محتوى غير لائق',
    'prohibited content': 'محتوى محظور',
    'sensitive content': 'محتوى حساس',
    'inappropriate images': 'صور غير لائقة',
    'prohibited item': 'منتج محظور',
    'spam': 'رسائل مزعجة',
    'scam': 'احتيال',
    'fraud': 'احتيال',
    'misleading': 'معلومات مضللة',
    'duplicate': 'إعلان مكرر',
  };

  let translatedMessage = message;
  for (const [en, ar] of Object.entries(patterns)) {
    translatedMessage = translatedMessage.replace(new RegExp(en, 'gi'), ar);
  }

  return translatedMessage;
}

/**
 * Translate rejection reason text to Arabic
 */
function translateRejectionReason(reason: string): string {
  // Check exact match in REJECTION_REASON_LABELS
  const upperReason = reason.toUpperCase().replace(/\s+/g, '_');
  if (REJECTION_REASON_LABELS[upperReason]) {
    return REJECTION_REASON_LABELS[upperReason];
  }

  // Common reason patterns
  const reasonPatterns: Record<string, string> = {
    'inappropriate_images': 'صور غير لائقة',
    'inappropriate images': 'صور غير لائقة',
    'sensitive content': 'محتوى حساس',
    'inappropriate content': 'محتوى غير لائق',
    'prohibited content': 'محتوى محظور',
    'violence': 'عنف',
    'weapons': 'أسلحة',
    'drugs': 'مخدرات',
    'adult content': 'محتوى للبالغين',
    'nudity': 'محتوى عاري',
    'hate speech': 'خطاب كراهية',
    'harassment': 'تحرش',
    'spam': 'رسائل مزعجة',
    'scam': 'احتيال',
  };

  const lowerReason = reason.toLowerCase();
  for (const [pattern, translation] of Object.entries(reasonPatterns)) {
    if (lowerReason.includes(pattern.toLowerCase())) {
      return translation;
    }
  }

  // If no match, return the original with underscores replaced
  return reason.replace(/_/g, ' ');
}
