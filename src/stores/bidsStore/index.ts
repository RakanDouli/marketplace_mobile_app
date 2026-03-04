/**
 * Bids Store
 * Manages bid data, placing bids, and fetching bid history
 */

import { create } from 'zustand';
import { graphqlRequest } from '../../services/graphql/client';
import {
  PLACE_BID_MUTATION,
  GET_LISTING_BIDS_QUERY,
  GET_MY_BIDS_QUERY,
  GET_HIGHEST_BID_QUERY,
  GET_PUBLIC_LISTING_BIDS_QUERY,
} from './bidsStore.gql';

export interface Bidder {
  id: string;
  name: string;
  email: string;
}

export interface Bid {
  id: string;
  listingId: string;
  bidderId: string;
  amount: number; // in USD dollars
  createdAt: string;
  bidder?: Bidder;
  listing?: {
    id: string;
    title: string;
    imageKeys: string[];
  };
}

interface BidsState {
  bids: Bid[];
  myBids: Bid[];
  highestBid: Bid | null;
  isLoading: boolean;
  error: string | null;
}

interface BidsActions {
  placeBid: (listingId: string, amount: number) => Promise<Bid>;
  fetchListingBids: (listingId: string) => Promise<void>;
  fetchPublicListingBids: (listingId: string) => Promise<void>;
  fetchMyBids: () => Promise<void>;
  fetchHighestBid: (listingId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearBids: () => void;
}

type BidsStore = BidsState & BidsActions;

export const useBidsStore = create<BidsStore>((set, get) => ({
  // Initial state
  bids: [],
  myBids: [],
  highestBid: null,
  isLoading: false,
  error: null,

  // Actions
  placeBid: async (listingId: string, amount: number): Promise<Bid> => {
    set({ isLoading: true, error: null });
    try {
      const response = await graphqlRequest<{ placeBid: Bid }>(
        PLACE_BID_MUTATION,
        { input: { listingId, amount } }
      );

      const newBid = response.placeBid;

      // Add to local state
      set((state) => ({
        bids: [newBid, ...state.bids],
        isLoading: false,
      }));

      return newBid;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to place bid';
      set({ error, isLoading: false });
      throw err;
    }
  },

  fetchListingBids: async (listingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await graphqlRequest<{ listingBids: Bid[] }>(
        GET_LISTING_BIDS_QUERY,
        { listingId }
      );

      set({
        bids: response.listingBids || [],
        isLoading: false,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch bids';
      set({ error, isLoading: false });
    }
  },

  fetchPublicListingBids: async (listingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await graphqlRequest<{ publicListingBids: Bid[] }>(
        GET_PUBLIC_LISTING_BIDS_QUERY,
        { listingId }
      );

      set({
        bids: response.publicListingBids || [],
        isLoading: false,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch bids';
      set({ error, isLoading: false });
    }
  },

  fetchMyBids: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await graphqlRequest<{ myBids: Bid[] }>(
        GET_MY_BIDS_QUERY,
        {}
      );

      set({
        myBids: response.myBids || [],
        isLoading: false,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch my bids';
      set({ error, isLoading: false });
    }
  },

  fetchHighestBid: async (listingId: string) => {
    try {
      const response = await graphqlRequest<{ highestBid: Bid | null }>(
        GET_HIGHEST_BID_QUERY,
        { listingId }
      );

      set({
        highestBid: response.highestBid || null,
      });
    } catch (err) {
      console.error('Error fetching highest bid:', err);
    }
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  clearError: () => {
    set({ error: null });
  },

  clearBids: () => {
    set({
      bids: [],
      myBids: [],
      highestBid: null,
      error: null,
    });
  },
}));
