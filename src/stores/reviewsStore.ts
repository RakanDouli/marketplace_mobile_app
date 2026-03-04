/**
 * Reviews Store
 * Fetches user reviews and creates new reviews
 */

import { create } from 'zustand';
import { graphqlRequest, authGraphqlRequest } from '../services/graphql/client';

const GET_USER_REVIEWS_QUERY = `
  query GetUserReviews($userId: ID!) {
    userReviews(userId: $userId) {
      id
      rating
      positiveTags
      negativeTags
      reviewerName
      reviewerAvatar
      createdAt
    }
  }
`;

const CREATE_REVIEW_MUTATION = `
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      reviewerId
      reviewerName
      reviewerAvatar
      reviewedUserId
      listingId
      threadId
      rating
      positiveTags
      negativeTags
      createdAt
    }
  }
`;

const CAN_REVIEW_USER_QUERY = `
  query CanReviewUser($reviewedUserId: ID!) {
    canReviewUser(reviewedUserId: $reviewedUserId)
  }
`;

export interface Review {
  id: string;
  rating: number;
  positiveTags: string[];
  negativeTags: string[];
  reviewerName: string;
  reviewerAvatar?: string;
  createdAt: string;
}

export interface CreateReviewInput {
  reviewedUserId: string;
  listingId?: string;
  threadId?: string;
  rating: number;
  positiveTags: string[];
  negativeTags: string[];
}

// Review tags matching web frontend - in Arabic
export const POSITIVE_REVIEW_TAGS = [
  'مطابق للوصف',           // As described
  'مطابق للصور',           // Matches photos
  'معلومات دقيقة',          // Accurate information
  'بائع متعاون',           // Cooperative seller
  'سريع الاستجابة',        // Fast response
  'احترافي في التعامل',    // Professional
  'صادق وأمين',            // Honest and trustworthy
  'أسعار معقولة',          // Reasonable prices
  'حالة ممتازة',           // Excellent condition
  'تسليم سريع',            // Fast delivery
] as const;

export const NEGATIVE_REVIEW_TAGS = [
  'لا يطابق الوصف',        // Doesn't match description
  'لا يطابق الصور',        // Doesn't match photos
  'معلومات غير دقيقة',     // Inaccurate information
  'بائع غير متعاون',       // Uncooperative seller
  'بطيء في الرد',          // Slow to respond
  'غير احترافي',           // Unprofessional
  'مضلل',                  // Misleading
  'أسعار مبالغ فيها',       // Overpriced
  'حالة سيئة',             // Poor condition
  'تأخير في التسليم',      // Delayed delivery
] as const;

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastFetchedUserId: string | null;

  // Actions
  fetchReviews: (userId: string) => Promise<void>;
  createReview: (input: CreateReviewInput) => Promise<Review>;
  canReviewUser: (reviewedUserId: string) => Promise<boolean>;
  clearReviews: () => void;

  // Computed helpers
  getRatingDistribution: () => Record<number, number>;
  getTagCounts: () => { positive: Record<string, number>; negative: Record<string, number> };
  getAverageRating: () => number;
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  lastFetchedUserId: null,

  fetchReviews: async (userId: string) => {
    // Skip if already fetched for this user
    if (get().lastFetchedUserId === userId && get().reviews.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await graphqlRequest<{ userReviews: Review[] }>(
        GET_USER_REVIEWS_QUERY,
        { userId }
      );

      set({
        reviews: result.userReviews || [],
        isLoading: false,
        lastFetchedUserId: userId,
      });
    } catch (error) {
      set({
        error: 'فشل تحميل التقييمات',
        isLoading: false,
      });
    }
  },

  createReview: async (input: CreateReviewInput): Promise<Review> => {
    set({ isSubmitting: true, error: null });

    try {
      const result = await authGraphqlRequest<{ createReview: Review }>(
        CREATE_REVIEW_MUTATION,
        { input }
      );

      set({ isSubmitting: false });
      return result.createReview;
    } catch (error: any) {
      const errorMessage = error.message || 'فشل في إنشاء التقييم';
      set({ isSubmitting: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  canReviewUser: async (reviewedUserId: string): Promise<boolean> => {
    try {
      const result = await authGraphqlRequest<{ canReviewUser: boolean }>(
        CAN_REVIEW_USER_QUERY,
        { reviewedUserId }
      );
      return result.canReviewUser || false;
    } catch (error) {
      return false;
    }
  },

  clearReviews: () => {
    set({
      reviews: [],
      lastFetchedUserId: null,
    });
  },

  // Get rating distribution (5-star, 4-star, etc.)
  getRatingDistribution: () => {
    const { reviews } = get();
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });

    return distribution;
  },

  // Get tag frequency counts
  getTagCounts: () => {
    const { reviews } = get();
    const positive: Record<string, number> = {};
    const negative: Record<string, number> = {};

    reviews.forEach((review) => {
      review.positiveTags?.forEach((tag) => {
        positive[tag] = (positive[tag] || 0) + 1;
      });
      review.negativeTags?.forEach((tag) => {
        negative[tag] = (negative[tag] || 0) + 1;
      });
    });

    return { positive, negative };
  },

  // Calculate average rating
  getAverageRating: () => {
    const { reviews } = get();
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10; // Round to 1 decimal
  },
}));
