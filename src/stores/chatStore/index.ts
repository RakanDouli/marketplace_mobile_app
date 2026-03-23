/**
 * Chat Store
 * Manages chat threads, messages, and real-time subscriptions
 */

import { create } from 'zustand';
import { graphqlRequest } from '../../services/graphql/client';
import { supabase } from '../../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  GET_OR_CREATE_THREAD_MUTATION,
  SEND_MESSAGE_MUTATION,
  MY_THREADS_QUERY,
  THREAD_MESSAGES_QUERY,
  MARK_THREAD_READ_MUTATION,
  UNREAD_COUNT_QUERY,
  DELETE_MESSAGE_MUTATION,
  DELETE_THREAD_MUTATION,
  BLOCK_USER_MUTATION,
  EDIT_MESSAGE_MUTATION,
  MY_BLOCKED_USERS_QUERY,
  UNBLOCK_USER_MUTATION,
  CREATE_IMAGE_UPLOAD_URL_MUTATION,
} from './chatStore.gql';
import type { ChatThread, ChatMessage, BlockedUser } from './types';

export type { ChatThread, ChatMessage, BlockedUser } from './types';

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  messages: Record<string, ChatMessage[]>;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  blockedUserIds: Set<string>;
  blockedUsers: BlockedUser[];
  realtimeChannel: RealtimeChannel | null;
  globalRealtimeChannel: RealtimeChannel | null;
  typingUsers: Record<string, string>;

  // Actions
  fetchMyThreads: () => Promise<void>;
  getOrCreateThread: (listingId: string, sellerId?: string) => Promise<string>;
  fetchThreadMessages: (threadId: string, limit?: number) => Promise<void>;
  sendMessage: (threadId: string, text?: string, imageKeys?: string[]) => Promise<void>;
  markThreadRead: (threadId: string, messageId?: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  blockUser: (blockedUserId: string) => Promise<void>;
  unblockUser: (blockedUserId: string) => Promise<void>;
  fetchBlockedUsers: () => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  createImageUploadUrl: () => Promise<{ uploadUrl: string; assetKey: string }>;
  setActiveThread: (threadId: string | null) => void;
  clearError: () => void;
  getThreadById: (threadId: string) => ChatThread | undefined;
  // Realtime
  subscribeToThread: (threadId: string, userId: string) => void;
  unsubscribeFromThread: () => void;
  broadcastTyping: (threadId: string, userName: string, userId: string) => void;
  subscribeGlobal: (userId: string) => void;
  unsubscribeGlobal: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  activeThreadId: null,
  messages: {},
  unreadCount: 0,
  isLoading: false,
  globalRealtimeChannel: null,
  error: null,
  blockedUserIds: new Set<string>(),
  blockedUsers: [],
  realtimeChannel: null,
  typingUsers: {},

  fetchMyThreads: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await graphqlRequest<{ myThreads: ChatThread[] }>(
        MY_THREADS_QUERY,
        {}
      );
      set({ threads: data.myThreads, isLoading: false });
    } catch (error) {
      set({ error: 'فشل في تحميل المحادثات', isLoading: false });
    }
  },

  getOrCreateThread: async (listingId: string, sellerId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await graphqlRequest<{ getOrCreateThread: ChatThread }>(
        GET_OR_CREATE_THREAD_MUTATION,
        { input: { listingId, sellerId } }
      );

      const thread = data.getOrCreateThread;

      set((state) => {
        const existingIndex = state.threads.findIndex((t) => t.id === thread.id);
        const updatedThreads =
          existingIndex >= 0
            ? state.threads.map((t, i) => (i === existingIndex ? thread : t))
            : [thread, ...state.threads];

        return { threads: updatedThreads, isLoading: false };
      });

      return thread.id;
    } catch (error) {
      set({ error: 'فشل في إنشاء المحادثة', isLoading: false });
      throw error;
    }
  },

  fetchThreadMessages: async (threadId: string, limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const data = await graphqlRequest<{ threadMessages: ChatMessage[] }>(
        THREAD_MESSAGES_QUERY,
        { threadId, limit }
      );

      set((state) => ({
        messages: {
          ...state.messages,
          [threadId]: data.threadMessages,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'فشل في تحميل الرسائل', isLoading: false });
    }
  },

  sendMessage: async (threadId: string, text?: string, imageKeys?: string[]) => {
    set({ error: null });
    try {
      const data = await graphqlRequest<{ sendMessage: ChatMessage }>(
        SEND_MESSAGE_MUTATION,
        { input: { threadId, text, imageKeys } }
      );

      const newMessage = data.sendMessage;

      // Add message to local state (with duplicate check)
      set((state) => {
        const existingMessages = state.messages[threadId] || [];
        // Check if message already exists (could be added by realtime subscription)
        const messageExists = existingMessages.some(msg => msg.id === newMessage.id);

        if (messageExists) {
          return state; // Don't add duplicate
        }

        return {
          messages: {
            ...state.messages,
            [threadId]: [...existingMessages, newMessage],
          },
          // Update thread's lastMessageAt
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, lastMessageAt: newMessage.createdAt } : t
          ),
        };
      });
    } catch (error) {
      set({ error: 'فشل في إرسال الرسالة' });
      throw error;
    }
  },

  markThreadRead: async (threadId: string, messageId?: string) => {
    try {
      await graphqlRequest(
        MARK_THREAD_READ_MUTATION,
        { input: { threadId, messageId } }
      );

      // Update local threads state
      set((state) => ({
        threads: state.threads.map((thread) =>
          thread.id === threadId ? { ...thread, unreadCount: 0 } : thread
        ),
      }));

      // Refresh unread count
      get().fetchUnreadCount();
    } catch (error) {
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await graphqlRequest<{ myUnreadCount: number }>(
        UNREAD_COUNT_QUERY,
        {}
      );
      set({ unreadCount: data.myUnreadCount });
    } catch (error) {
      // Silently ignore auth errors
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await graphqlRequest(
        DELETE_MESSAGE_MUTATION,
        { input: { messageId } }
      );

      // Remove message from local state
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((threadId) => {
          newMessages[threadId] = newMessages[threadId].filter((m) => m.id !== messageId);
        });
        return { messages: newMessages };
      });
    } catch (error) {
      set({ error: 'فشل في حذف الرسالة' });
      throw error;
    }
  },

  deleteThread: async (threadId: string) => {
    try {
      await graphqlRequest(
        DELETE_THREAD_MUTATION,
        { threadId }
      );

      // Remove thread and its messages from local state
      set((state) => {
        const newMessages = { ...state.messages };
        delete newMessages[threadId];
        return {
          threads: state.threads.filter((t) => t.id !== threadId),
          activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
          messages: newMessages,
        };
      });
    } catch (error) {
      set({ error: 'فشل في حذف المحادثة' });
      throw error;
    }
  },

  editMessage: async (messageId: string, newText: string) => {
    try {
      const data = await graphqlRequest<{ editMessage: ChatMessage }>(
        EDIT_MESSAGE_MUTATION,
        { input: { messageId, text: newText } }
      );

      const updatedMessage = data.editMessage;

      // Update message in local state
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((threadId) => {
          newMessages[threadId] = newMessages[threadId].map((m) =>
            m.id === messageId ? { ...m, ...updatedMessage } : m
          );
        });
        return { messages: newMessages };
      });
    } catch (error) {
      set({ error: 'فشل في تعديل الرسالة' });
      throw error;
    }
  },

  blockUser: async (blockedUserId: string) => {
    try {
      await graphqlRequest(
        BLOCK_USER_MUTATION,
        { blockedUserId }
      );

      // Add to blocked users set
      set((state) => {
        const newBlockedUserIds = new Set(state.blockedUserIds);
        newBlockedUserIds.add(blockedUserId);
        return { blockedUserIds: newBlockedUserIds };
      });

      // Refresh threads
      get().fetchMyThreads();
    } catch (error) {
      set({ error: 'فشل في حظر المستخدم' });
      throw error;
    }
  },

  unblockUser: async (blockedUserId: string) => {
    try {
      await graphqlRequest(
        UNBLOCK_USER_MUTATION,
        { blockedUserId }
      );

      // Remove from blocked users
      set((state) => {
        const newBlockedUserIds = new Set(state.blockedUserIds);
        newBlockedUserIds.delete(blockedUserId);
        const newBlockedUsers = state.blockedUsers.filter(
          (b) => b.blockedUserId !== blockedUserId
        );
        return {
          blockedUserIds: newBlockedUserIds,
          blockedUsers: newBlockedUsers,
        };
      });

      // Refresh threads
      get().fetchMyThreads();
    } catch (error) {
      set({ error: 'فشل في إلغاء حظر المستخدم' });
      throw error;
    }
  },

  fetchBlockedUsers: async () => {
    try {
      const data = await graphqlRequest<{ myBlockedUsers: BlockedUser[] }>(
        MY_BLOCKED_USERS_QUERY,
        {}
      );

      const blockedIds = new Set(data.myBlockedUsers.map((b) => b.blockedUserId));
      set({
        blockedUserIds: blockedIds,
        blockedUsers: data.myBlockedUsers,
      });
    } catch (error) {
      set({ error: 'فشل في تحميل قائمة المحظورين' });
    }
  },

  isUserBlocked: (userId: string): boolean => {
    return get().blockedUserIds.has(userId);
  },

  createImageUploadUrl: async () => {
    try {
      const data = await graphqlRequest<{
        createImageUploadUrl: { uploadUrl: string; assetKey: string };
      }>(CREATE_IMAGE_UPLOAD_URL_MUTATION, {});

      return data.createImageUploadUrl;
    } catch (error) {
      set({ error: 'فشل في إنشاء رابط رفع الصورة' });
      throw error;
    }
  },

  setActiveThread: (threadId: string | null) => {
    set({ activeThreadId: threadId });
  },

  clearError: () => {
    set({ error: null });
  },

  getThreadById: (threadId: string) => {
    return get().threads.find((t) => t.id === threadId);
  },

  // Realtime Subscriptions
  subscribeToThread: (threadId: string, userId: string) => {
    const { realtimeChannel } = get();

    // Unsubscribe from previous channel
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    // Create new channel for this thread
    const channel = supabase
      .channel(`thread:${threadId}`)
      // Listen for new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          // Client-side filter: only process messages for this thread
          if (newMessage.threadId !== threadId) {
            return;
          }

          // Add message if not from current user AND not already in state
          if (newMessage.senderId !== userId) {
            set((state) => {
              // Check if message already exists
              const existingMessages = state.messages[threadId] || [];
              const messageExists = existingMessages.some(msg => msg.id === newMessage.id);

              if (messageExists) {
                return state; // Don't add duplicate
              }

              return {
                messages: {
                  ...state.messages,
                  [threadId]: [...existingMessages, newMessage],
                },
                threads: state.threads.map((thread) =>
                  thread.id === threadId
                    ? {
                        ...thread,
                        lastMessageAt: newMessage.createdAt,
                        unreadCount: (thread.unreadCount || 0) + 1,
                      }
                    : thread
                ),
              };
            });

            // Auto-mark as read if thread is active
            if (get().activeThreadId === threadId) {
              get().markThreadRead(threadId, newMessage.id);
            }

            get().fetchUnreadCount();
          }
        }
      )
      // Listen for message updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;

          // Client-side filter: only process messages for this thread
          if (updatedMessage.threadId !== threadId) {
            return;
          }

          set((state) => ({
            messages: {
              ...state.messages,
              [threadId]: (state.messages[threadId] || []).map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              ),
            },
          }));
        }
      )
      // Typing indicator via presence
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUser = Object.values(state).find(
          (presences: any) => presences[0]?.typing && presences[0]?.userId !== userId
        );

        if (typingUser) {
          set((state) => ({
            typingUsers: {
              ...state.typingUsers,
              [threadId]: (typingUser as any)[0].userName,
            },
          }));

          // Clear after 3 seconds
          setTimeout(() => {
            set((state) => {
              const { [threadId]: _, ...rest } = state.typingUsers;
              return { typingUsers: rest };
            });
          }, 3000);
        } else {
          set((state) => {
            const { [threadId]: _, ...rest } = state.typingUsers;
            return { typingUsers: rest };
          });
        }
      })
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromThread: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null, typingUsers: {} });
    }
  },

  broadcastTyping: (threadId: string, userName: string, userId: string) => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.track({
        typing: true,
        userName,
        userId,
      });

      setTimeout(() => {
        if (realtimeChannel) {
          realtimeChannel.track({ typing: false });
        }
      }, 2000);
    }
  },

  // Global realtime subscription (listens to ALL threads for this user)
  subscribeGlobal: (userId: string) => {
    const { globalRealtimeChannel, threads } = get();

    // Don't subscribe if already subscribed
    if (globalRealtimeChannel) {
      return;
    }

    // Create global channel that listens to ALL chat messages
    const channel = supabase
      .channel(`global:${userId}`)
      // Listen for ALL new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          // Only process if message is in one of user's threads
          const thread = threads.find(t => t.id === newMessage.threadId);
          if (!thread) return;

          // If message is from another user (not current user)
          if (newMessage.senderId !== userId) {
            // Update threads state and add message (with duplicate check)
            set((state) => {
              const existingMessages = state.messages[newMessage.threadId] || [];
              // Check if message already exists (could be added by thread subscription)
              const messageExists = existingMessages.some(msg => msg.id === newMessage.id);

              if (messageExists) {
                // Just update unread count, don't add duplicate message
                return {
                  threads: state.threads.map(t =>
                    t.id === newMessage.threadId
                      ? {
                          ...t,
                          lastMessageAt: newMessage.createdAt,
                          unreadCount: (t.unreadCount || 0) + 1,
                        }
                      : t
                  ),
                  unreadCount: state.unreadCount + 1,
                };
              }

              return {
                threads: state.threads.map(t =>
                  t.id === newMessage.threadId
                    ? {
                        ...t,
                        lastMessageAt: newMessage.createdAt,
                        unreadCount: (t.unreadCount || 0) + 1,
                      }
                    : t
                ),
                messages: {
                  ...state.messages,
                  [newMessage.threadId]: [...existingMessages, newMessage],
                },
                // Increment unread count immediately
                unreadCount: state.unreadCount + 1,
              };
            });
          }
        }
      )
      // Listen for participant updates (when messages are read)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
        },
        (payload) => {
          const participant = payload.new as any;

          // Only process if participant is in one of user's threads
          const thread = threads.find(t => t.id === participant.threadId);
          if (!thread) return;

          // Refresh unread count when anyone reads
          get().fetchUnreadCount();
        }
      )
      .subscribe();

    set({ globalRealtimeChannel: channel });
  },

  unsubscribeGlobal: () => {
    const { globalRealtimeChannel } = get();
    if (globalRealtimeChannel) {
      supabase.removeChannel(globalRealtimeChannel);
      set({ globalRealtimeChannel: null });
    }
  },
}));
