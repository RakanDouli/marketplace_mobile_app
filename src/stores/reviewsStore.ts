/**
 * Reviews Store
 * Fetches user reviews for the reviews modal
 */

import { create } from 'zustand';
import { graphqlRequest } from '../services/graphql/client';

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

export interface Review {
  id: string;
  rating: number;
  positiveTags: string[];
  negativeTags: string[];
  reviewerName: string;
  reviewerAvatar?: string;
  createdAt: string;
}

// Review tag translations
export const POSITIVE_TAGS: Record<string, string> = {
  fast: 'سريع',
  respectful: 'محترم',
  accurate: 'دقيق',
  friendly: 'ودود',
  professional: 'محترف',
  reliable: 'موثوق',
};

export const NEGATIVE_TAGS: Record<string, string> = {
  slow: 'متأخر',
  rude: 'غير مهذب',
  inaccurate: 'غير دقيق',
  unfriendly: 'غير ودود',
  unprofessional: 'غير محترف',
  unreliable: 'غير موثوق',
};

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  lastFetchedUserId: string | null;

  fetchReviews: (userId: string) => Promise<void>;
  clearReviews: () => void;

  // Computed helpers
  getRatingDistribution: () => Record<number, number>;
  getTagCounts: () => { positive: Record<string, number>; negative: Record<string, number> };
  getAverageRating: () => number;
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
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
      console.error('[reviewsStore] Error fetching reviews:', error);
      set({
        error: 'فشل تحميل التقييمات',
        isLoading: false,
      });
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
