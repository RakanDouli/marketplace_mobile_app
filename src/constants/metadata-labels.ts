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

  // Return original as fallback
  return value;
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
  NEW: "جديد",
  USED_LIKE_NEW: "مستعمل كالجديد",
  USED_GOOD: "مستعمل بحالة جيدة",
  USED_FAIR: "مستعمل بحالة مقبولة",
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
  rif_dimashq: "ريف دمشق",
  aleppo: "حلب",
  homs: "حمص",
  hama: "حماة",
  latakia: "اللاذقية",
  tartus: "طرطوس",
  idlib: "إدلب",
  deir_ez_zor: "دير الزور",
  al_hasakah: "الحسكة",
  ar_raqqah: "الرقة",
  as_suwayda: "السويداء",
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
