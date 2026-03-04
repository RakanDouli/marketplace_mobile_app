/**
 * Messages Tab - Chat Thread List
 * Shows all user's conversations with listing info
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useTheme, Theme } from '../../src/theme';
import { Text, Loading } from '../../src/components/slices';
import { useChatStore, ChatThread } from '../../src/stores/chatStore';
import { useUserAuthStore } from '../../src/stores/userAuthStore';
import { useListingsStore, Listing } from '../../src/stores/listingsStore';
import { getCloudflareImageUrl } from '../../src/utils/cloudflare-images';
import { formatRelativeTime } from '../../src/utils';

// Thread with fetched listing data (like web frontend)
interface ThreadWithListing extends ChatThread {
  fetchedListing: Listing | null;
}

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Auth
  const { isAuthenticated, profile } = useUserAuthStore();
  const currentUserId = profile?.id;

  // Chat store
  const {
    threads,
    isLoading,
    fetchMyThreads,
    fetchBlockedUsers,
  } = useChatStore();

  // Listings store (like web frontend)
  const { fetchListingById } = useListingsStore();

  // Threads with fetched listings (like web frontend pattern)
  const [threadsWithListings, setThreadsWithListings] = useState<ThreadWithListing[]>([]);

  // Fetch threads on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyThreads();
      fetchBlockedUsers();
    }
  }, [isAuthenticated]);

  // Fetch listing details for each thread (like web frontend)
  // Note: Listings may be deleted/archived - this is expected for old threads
  useEffect(() => {
    if (threads.length === 0) {
      setThreadsWithListings([]);
      return;
    }

    let isMounted = true;

    const fetchListingsForThreads = async () => {
      const threadsWithData: ThreadWithListing[] = [];

      for (const thread of threads) {
        // Try to fetch listing - may not exist (deleted/archived)
        await fetchListingById(thread.listingId);
        const listing = useListingsStore.getState().currentListing;
        // Always add thread, listing will be null if not found
        threadsWithData.push({ ...thread, fetchedListing: listing });
      }

      if (isMounted) {
        setThreadsWithListings(threadsWithData);
      }
    };

    fetchListingsForThreads();

    return () => {
      isMounted = false;
    };
  }, [threads, fetchListingById]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    fetchMyThreads();
  }, []);

  // Navigate to chat
  const handleThreadPress = (thread: ChatThread) => {
    router.push(`/chat/${thread.id}`);
  };

  // Get other user ID in thread (for display)
  // Note: Backend doesn't provide buyer/seller user objects, only IDs
  const getOtherUserId = (thread: ChatThread) => {
    if (!currentUserId) return null;
    const isBuyer = thread.buyerId === currentUserId;
    return isBuyer ? thread.sellerId : thread.buyerId;
  };

  // Render thread item
  const renderThread = ({ item: thread }: { item: ThreadWithListing }) => {
    const hasUnread = (thread.unreadCount || 0) > 0;
    // Use fetchedListing (from listingsStore) like web frontend
    const listing = thread.fetchedListing;
    const listingImage = listing?.imageKeys?.[0] || thread.listing?.images?.[0];
    const isBuyer = thread.buyerId === currentUserId;
    // Seller name from fetched listing user (like web frontend)
    const sellerName = listing?.user?.companyName || listing?.user?.name || 'البائع';

    return (
      <TouchableOpacity
        style={[
          styles.threadItem,
          hasUnread && styles.threadItemUnread,
        ]}
        onPress={() => handleThreadPress(thread)}
        activeOpacity={0.7}
      >
        {/* Thread Info (RTL: text first = appears on right) */}
        <View style={styles.threadInfo}>
          {/* Listing Title */}
          <Text
            variant="body"
            weight="semibold"
            numberOfLines={1}
            style={styles.listingTitle}
          >
            {listing?.title || thread.listing?.title || 'إعلان محذوف'}
          </Text>

          {/* Seller name (only show if current user is buyer) */}
          {isBuyer && (
            <Text
              variant="small"
              color="secondary"
              numberOfLines={1}
              style={styles.userName}
            >
              {sellerName}
            </Text>
          )}

          {/* Last Message Time */}
          {thread.lastMessageAt && (
            <Text variant="small" color="muted" style={styles.timeText}>
              {formatRelativeTime(thread.lastMessageAt)}
            </Text>
          )}
        </View>

        {/* Listing Image (RTL: image second = appears on left) */}
        <View style={styles.imageContainer}>
          {listingImage ? (
            <Image
              source={{ uri: getCloudflareImageUrl(listingImage, 'small') }}
              style={styles.listingImage}
            />
          ) : (
            <View style={[styles.listingImage, styles.imagePlaceholder]}>
              <MessageCircle size={24} color={theme.colors.textMuted} />
            </View>
          )}
          {/* Unread badge */}
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text variant="small" style={styles.unreadText}>
                {thread.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={64} color={theme.colors.textMuted} strokeWidth={1} />
      <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
        لا توجد محادثات
      </Text>
      <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
        عند مراسلة أي بائع، ستظهر المحادثة هنا
      </Text>
    </View>
  );

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">الرسائل</Text>
        </View>
        <View style={styles.emptyState}>
          <MessageCircle size={64} color={theme.colors.textMuted} strokeWidth={1} />
          <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
            سجل الدخول
          </Text>
          <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
            سجل دخولك لعرض رسائلك
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">الرسائل</Text>
      </View>

      {/* Thread List */}
      {isLoading && threadsWithListings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Loading type="svg" size="lg" />
        </View>
      ) : (
        <FlatList
          data={threadsWithListings}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          contentContainerStyle={[
            styles.listContent,
            threadsWithListings.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    header: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingVertical: theme.spacing.sm,
    },
    emptyList: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: 100,
    },

    // Thread Item
    threadItem: {
      flexDirection: theme.isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    threadItemUnread: {
      backgroundColor: theme.colors.primaryLight,
    },
    imageContainer: {
      position: 'relative',
    },
    listingImage: {
      width: 60,
      height: 60,
      borderRadius: theme.radius.md,
    },
    imagePlaceholder: {
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    threadInfo: {
      flex: 1,
      gap: 2,
      alignItems: theme.isRTL ? 'flex-end' : 'flex-start',
    },
    listingTitle: {
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    userName: {
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    timeText: {
      textAlign: theme.isRTL ? 'right' : 'left',
    },
  });
