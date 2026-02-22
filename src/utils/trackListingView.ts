/**
 * Track listing view for analytics
 * Sends mutation to backend to record the view
 * Backend handles deduplication (30-minute session window)
 */

import { graphqlRequest } from '../services/graphql/client';

const TRACK_LISTING_VIEW_MUTATION = `
  mutation TrackListingView($listingId: ID!) {
    trackListingView(listingId: $listingId)
  }
`;

/**
 * Track a view for a listing
 * @param listingId - The listing ID to track
 * @returns true if tracked successfully, false if duplicate or error
 */
export async function trackListingView(listingId: string): Promise<boolean> {
  try {
    const result = await graphqlRequest<{ trackListingView: boolean }>(
      TRACK_LISTING_VIEW_MUTATION,
      { listingId }
    );
    return result.trackListingView;
  } catch (error) {
    // Silently fail - view tracking shouldn't break the app
    console.warn('[trackListingView] Failed to track view:', error);
    return false;
  }
}

export default trackListingView;
