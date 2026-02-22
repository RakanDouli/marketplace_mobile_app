/**
 * Chat Store Types
 * Types for chat threads and messages
 */

export interface ThreadListing {
  id: string;
  title: string;
  priceMinor: number;
  currency: string;
  images: string[];
}

export interface ThreadUser {
  id: string;
  name: string | null;
  companyName: string | null;
  avatar: string | null;
}

export interface ChatThread {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  listing?: ThreadListing | null;
  buyer?: ThreadUser | null;
  seller?: ThreadUser | null;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string | null;
  imageKeys: string[] | null;
  messageType?: 'text' | 'review_request';
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface BlockedUser {
  id: string;
  blockedUserId: string;
  blockedAt: string;
  blockedUser: {
    id: string;
    name: string | null;
    companyName: string | null;
    email: string;
  };
}
