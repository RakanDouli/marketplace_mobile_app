/**
 * BiddingSection Component
 * Allows users to place bids on listings and view bid history
 * Matching web frontend functionality
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Gavel } from 'lucide-react-native';
import { useTheme, Theme } from '../../../theme';
import { Text, Button } from '../../slices';
import { PriceInput } from '../../slices/PriceInput';
import { useBidsStore, Bid } from '../../../stores/bidsStore';
import { useChatStore } from '../../../stores/chatStore';
import { useUserAuthStore } from '../../../stores/userAuthStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useCurrencyStore } from '../../../stores/currencyStore';
import { formatPrice, formatDate } from '../../../utils';

interface BiddingSectionProps {
  listingId: string;
  listingOwnerId: string;
  allowBidding: boolean;
  biddingStartPrice: number | null;
}

export function BiddingSection({
  listingId,
  listingOwnerId,
  allowBidding,
  biddingStartPrice,
}: BiddingSectionProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { profile: user } = useUserAuthStore();
  const { bids, highestBid, isLoading, fetchHighestBid, fetchPublicListingBids, placeBid } = useBidsStore();
  const { getOrCreateThread, sendMessage } = useChatStore();
  const { addNotification } = useNotificationStore();
  const { preferredCurrency } = useCurrencyStore();

  const [bidAmount, setBidAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = user?.id === listingOwnerId;

  // Fetch highest bid and all bids on mount
  useEffect(() => {
    if (allowBidding) {
      fetchHighestBid(listingId);
      fetchPublicListingBids(listingId);
    }
  }, [listingId, allowBidding, fetchHighestBid, fetchPublicListingBids]);

  // Initialize input with highest bid or start price (in USD dollars)
  useEffect(() => {
    if (highestBid) {
      // Show highest bid + $1 increment
      const nextBid = highestBid.amount + 1;
      setBidAmount(nextBid);
    } else if (biddingStartPrice) {
      // Show start price (in dollars)
      setBidAmount(biddingStartPrice);
    }
  }, [highestBid, biddingStartPrice]);

  // Get unique bidders (only show latest bid per bidder)
  const uniqueBidders = useMemo(() => {
    const map = new Map<string, Bid>();
    bids.forEach((bid) => {
      const existingBid = map.get(bid.bidderId);
      // Keep the highest bid from each bidder
      if (!existingBid || bid.amount > existingBid.amount) {
        map.set(bid.bidderId, bid);
      }
    });
    return map;
  }, [bids]);

  // Get last 4 unique bidders sorted by highest bid
  const recentBids = useMemo(() => {
    return Array.from(uniqueBidders.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [uniqueBidders]);

  const handlePlaceBid = useCallback(async () => {
    setError(null);

    if (!user) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'يجب تسجيل الدخول لتقديم عرض',
      });
      return;
    }

    if (isOwner) {
      setError('لا يمكنك تقديم عرض على إعلانك الخاص');
      return;
    }

    // bidAmount is in USD dollars from the price input
    if (isNaN(bidAmount) || bidAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);

    try {
      // Place bid (in USD dollars)
      await placeBid(listingId, bidAmount);

      // Create/get chat thread with owner (auto-creates if doesn't exist)
      const threadId = await getOrCreateThread(listingId, listingOwnerId);

      // Send message with bid amount in USD
      const bidMessage = `${user?.name || 'مستخدم'} قدم عرضاً بمبلغ $${bidAmount}`;

      await sendMessage(threadId, bidMessage);

      addNotification({
        type: 'success',
        title: 'نجاح',
        message: 'تم تقديم عرضك بنجاح',
      });

      setBidAmount(0);

      // Refresh highest bid and bid list
      await fetchHighestBid(listingId);
      await fetchPublicListingBids(listingId);
    } catch (err) {
      // Map backend error messages to user-friendly Arabic messages
      const errorMessage = err instanceof Error ? err.message : '';

      if (errorMessage.includes('Bid amount too low') || errorMessage.includes('BID_TOO_LOW')) {
        setError('المبلغ المقدم أقل من الحد الأدنى المطلوب');
      } else if (errorMessage.includes('LISTING_NOT_FOUND')) {
        setError('الإعلان غير موجود');
      } else if (errorMessage.includes('LISTING_NOT_ACTIVE')) {
        setError('الإعلان غير نشط');
      } else if (errorMessage.includes('CANNOT_BID_OWN_LISTING')) {
        setError('لا يمكنك تقديم عرض على إعلانك الخاص');
      } else if (errorMessage.includes('BIDDING_NOT_ALLOWED')) {
        setError('المزايدة غير مسموحة على هذا الإعلان');
      } else {
        setError('فشل تقديم العرض');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    isOwner,
    bidAmount,
    listingId,
    listingOwnerId,
    placeBid,
    getOrCreateThread,
    sendMessage,
    addNotification,
    fetchHighestBid,
    fetchPublicListingBids,
  ]);

  if (!allowBidding) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h4" style={styles.headerText}>المزايدة</Text>
        <Gavel size={24} color={theme.colors.primary} />
      </View>

      {/* Bid Form - Only for logged in non-owners */}
      {!isOwner && user && (
        <View style={styles.form}>
          <PriceInput
            value={bidAmount}
            onChange={setBidAmount}
            label="قيمة العرض"
            placeholder="أدخل المبلغ"
            error={error || undefined}
          />
          <Button
            variant="primary"
            onPress={handlePlaceBid}
            disabled={isSubmitting || bidAmount <= 0}
            loading={isSubmitting}
            icon={<Gavel size={18} color="#FFFFFF" />}
            style={styles.submitButton}
          >
            تقديم عرض
          </Button>
        </View>
      )}

      {/* Login Prompt */}
      {!user && !isOwner && (
        <View style={styles.loginPrompt}>
          <Text variant="small" color="secondary" center>
            يجب تسجيل الدخول لتقديم عرض
          </Text>
        </View>
      )}

      {/* Bids List */}
      {recentBids.length > 0 && (
        <View style={styles.bidsList}>
          <Text variant="small" color="secondary" style={styles.bidsListTitle}>
            العروض السابقة
          </Text>
          <ScrollView
            style={styles.bidsScrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {recentBids.map((bid) => (
              <View key={bid.id} style={styles.bidRow}>
                <Text variant="small">{bid.bidder?.name || 'مستخدم'}</Text>
                <Text variant="small" bold style={styles.bidAmount}>
                  {formatPrice(bid.amount, preferredCurrency)}
                </Text>
                <Text variant="xs" color="muted">
                  {formatDate(bid.createdAt)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Loading State */}
      {isLoading && recentBids.length === 0 && (
        <Text variant="small" color="secondary" center>
          جاري التحميل...
        </Text>
      )}

      {/* No Bids State */}
      {!isLoading && recentBids.length === 0 && (
        <Text variant="small" color="secondary" center>
          لا توجد عروض حتى الآن
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.bg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    headerText: {
      color: theme.colors.primary,
    },
    form: {
      gap: theme.spacing.md,
    },
    submitButton: {
      marginTop: theme.spacing.sm,
    },
    loginPrompt: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
    },
    bidsList: {
      gap: theme.spacing.sm,
    },
    bidsListTitle: {
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    bidsScrollContainer: {
      maxHeight: 200,
    },
    bidRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.sm,
    },
    bidAmount: {
      flex: 1,
      textAlign: 'center',
    },
  });

export default BiddingSection;
