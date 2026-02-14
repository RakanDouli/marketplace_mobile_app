/**
 * Frontend Enums - Mirrors of Backend Enums
 *
 * Purpose: Type-safe comparisons in code
 * Usage: if (listing.status === ListingStatus.ACTIVE) { }
 *
 * IMPORTANT: These must match backend GraphQL enum values exactly
 * - UPPERCASE keys with UPPERCASE values: ListingStatus, ListingType
 * - UPPERCASE keys with lowercase values: UserStatus, AccountType, AdCampaignStatus
 */

// ============================================================
// USER & ACCOUNT ENUMS (values are lowercase)
// ============================================================

export enum UserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  BANNED = "banned",
}

export enum AccountType {
  INDIVIDUAL = "individual",
  DEALER = "dealer",
  BUSINESS = "business",
}

export enum UserRole {
  USER = "user",
  EDITOR = "editor",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum AccountBadge {
  NONE = "none",
  VERIFIED = "verified",
  PREMIUM = "premium",
}

// ============================================================
// LISTING ENUMS (values are UPPERCASE)
// ============================================================

export enum ListingStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  HIDDEN = "HIDDEN",
  ARCHIVED = "ARCHIVED",
  SOLD = "SOLD",
  EXPIRED = "EXPIRED",
}

export enum ListingType {
  SALE = "SALE",
  RENT = "RENT",
}

export enum Condition {
  NEW = "NEW",
  USED_LIKE_NEW = "USED_LIKE_NEW",
  USED_GOOD = "USED_GOOD",
  USED_FAIR = "USED_FAIR",
}

export enum RejectionReason {
  INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT",
  MISLEADING_INFORMATION = "MISLEADING_INFORMATION",
  PROHIBITED_ITEM = "PROHIBITED_ITEM",
  DUPLICATE_LISTING = "DUPLICATE_LISTING",
  POOR_QUALITY_IMAGES = "POOR_QUALITY_IMAGES",
  INCOMPLETE_INFORMATION = "INCOMPLETE_INFORMATION",
  PRICING_ISSUES = "PRICING_ISSUES",
  SPAM = "SPAM",
  SCAM_SUSPECTED = "SCAM_SUSPECTED",
  OTHER = "OTHER",
}

// ============================================================
// SUBSCRIPTION ENUMS (mixed case)
// ============================================================

export enum BillingCycle {
  FREE = "FREE",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

// ============================================================
// AD SYSTEM ENUMS (values are lowercase)
// ============================================================

export enum AdMediaType {
  IMAGE = "image",
  VIDEO = "video",
}

export enum AdCampaignStatus {
  DRAFT = "draft",
  PAYMENT_SENT = "payment_sent",
  PAID = "paid",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum AdClientStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum AdPlacement {
  HOMEPAGE_TOP = "homepage_top",
  HOMEPAGE_MID = "homepage_mid",
  BETWEEN_LISTINGS = "between_listings",
  DETAIL_TOP = "detail_top",
  DETAIL_BEFORE_DESCRIPTION = "detail_before_description",
}

// ============================================================
// TRANSACTION ENUMS (values are lowercase)
// ============================================================

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  BANK_TRANSFER = "bank_transfer",
  CASH = "cash",
}

// ============================================================
// REPORT ENUMS (values are lowercase)
// ============================================================

export enum ReportStatus {
  PENDING = "pending",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
  IN_REVIEW = "in_review",
  ESCALATED = "escalated",
}

export enum ReportReason {
  FRAUD = "fraud",
  SPAM = "spam",
  INAPPROPRIATE = "inappropriate",
  HARASSMENT = "harassment",
  FAKE_LISTING = "fake_listing",
  WRONG_CATEGORY = "wrong_category",
  DUPLICATE = "duplicate",
  OFFENSIVE = "offensive",
  OTHER = "other",
}

// ============================================================
// CHAT/MESSAGE ENUMS (values are lowercase)
// ============================================================

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
}
