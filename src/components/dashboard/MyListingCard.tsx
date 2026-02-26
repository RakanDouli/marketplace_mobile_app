/**
 * MyListingCard Component
 * Reusable card for user's own listings in the dashboard
 * Shows status badge, warning messages, view count, and action buttons
 */

import React, { useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Eye, Edit2, Trash2, FileEdit, AlertTriangle, XCircle } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { Image } from '../slices/Image';
import { Button } from '../slices/Button';
import { LISTING_STATUS_LABELS, getLabel, REJECTION_REASON_LABELS } from '../../constants/metadata-labels';
import { ListingStatus, UserListing } from '../../stores/userListingsStore';
import { formatPrice } from '../../utils/formatPrice';
import { useCurrencyStore } from '../../stores/currencyStore';

export interface MyListingCardProps {
  listing: UserListing;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onContinueDraft?: () => void;
}

// Status colors mapping
const STATUS_COLORS: Record<ListingStatus, { bg: string; text: string }> = {
  ACTIVE: { bg: '#22c55e20', text: '#16a34a' },
  DRAFT: { bg: '#64748b20', text: '#475569' },
  PENDING_APPROVAL: { bg: '#f59e0b20', text: '#d97706' },
  REJECTED: { bg: '#ef444420', text: '#dc2626' },
  HIDDEN: { bg: '#64748b20', text: '#475569' },
  SOLD: { bg: '#3b82f620', text: '#2563eb' },
  ARCHIVED: { bg: '#64748b20', text: '#475569' },
};

export const MyListingCard = memo(function MyListingCard({
  listing,
  onPress,
  onEdit,
  onDelete,
  onContinueDraft,
}: MyListingCardProps) {
  const theme = useTheme();
  const { selectedCurrency } = useCurrencyStore();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isDraft = listing.status === 'DRAFT';
  const isRejected = listing.status === 'REJECTED';
  const isPending = listing.status === 'PENDING_APPROVAL';
  const showWarning = isDraft || isRejected;

  // Get first image
  const imageKey = listing.imageKeys?.[0] || null;

  // Format price
  const priceFormatted = useMemo(() => {
    return formatPrice(listing.priceMinor, selectedCurrency);
  }, [listing.priceMinor, selectedCurrency]);

  // Get status colors
  const statusColors = STATUS_COLORS[listing.status] || STATUS_COLORS.DRAFT;

  // Get rejection message
  const rejectionMessage = useMemo(() => {
    if (!isRejected) return null;
    if (listing.rejectionMessage) return listing.rejectionMessage;
    if (listing.rejectionReason) {
      return getLabel(listing.rejectionReason, REJECTION_REASON_LABELS);
    }
    return 'تم رفض الإعلان';
  }, [isRejected, listing.rejectionMessage, listing.rejectionReason]);

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            src={imageKey}
            variant="mobile"
            aspectRatio={4 / 3}
            borderRadius={0}
          />

          {/* View Count */}
          {listing.viewCount !== undefined && listing.viewCount > 0 && (
            <View style={styles.viewCount}>
              <Eye size={12} color={theme.colors.textMuted} />
              <Text variant="xs" color="muted">
                {listing.viewCount}
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Status Badge - Below Image, Above Title */}
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text variant="xs" style={[styles.statusText, { color: statusColors.text }]}>
              {getLabel(listing.status, LISTING_STATUS_LABELS)}
            </Text>
          </View>

          <Text variant="small" numberOfLines={2} style={styles.title}>
            {listing.title}
          </Text>
          <Text variant="h4" color="primary" style={styles.price}>
            {priceFormatted}
          </Text>
        </View>

        {/* Warning Message (Draft or Rejected) */}
        {showWarning && (
          <View style={[styles.warningBanner, isRejected && styles.rejectedBanner]}>
            {isRejected ? (
              <XCircle size={14} color={theme.colors.error} />
            ) : (
              <AlertTriangle size={14} color={theme.colors.warning} />
            )}
            <Text
              variant="xs"
              style={[styles.warningText, isRejected && { color: theme.colors.error }]}
              numberOfLines={2}
            >
              {isRejected
                ? rejectionMessage
                : 'إعلان غير مكتمل - اضغط إكمال لنشره'}
            </Text>
          </View>
        )}

        {/* Pending Message */}
        {isPending && (
          <View style={styles.pendingBanner}>
            <Text variant="xs" color="warning" style={styles.pendingText}>
              قيد المراجعة - سيتم النشر بعد الموافقة
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {isDraft ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onPress={onContinueDraft}
              icon={<FileEdit size={14} color={theme.colors.surface} />}
              style={styles.actionButton}
            >
              إكمال
            </Button>
            <Button
              variant="danger"
              size="sm"
              onPress={onDelete}
              icon={<Trash2 size={14} color={theme.colors.textInverse} />}
            />
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onPress={onEdit}
              icon={<Edit2 size={14} color={theme.colors.primary} />}
              style={styles.actionButton}
            >
              تعديل
            </Button>
            <Button
              variant="danger"
              size="sm"
              onPress={onDelete}
              icon={<Trash2 size={14} color={theme.colors.textInverse} />}
            />
          </>
        )}
      </View>
    </View>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    card: {
      backgroundColor: theme.colors.surface,
    },
    imageContainer: {
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.radius.sm,
      marginBottom: theme.spacing.xs,
    },
    statusText: {
      fontWeight: '600',
    },
    viewCount: {
      position: 'absolute',
      bottom: theme.spacing.sm,
      end: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.9)',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.radius.full,
    },
    content: {
      padding: theme.spacing.sm,
    },
    title: {
      marginBottom: theme.spacing.xs,
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    price: {
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: '#f59e0b10',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.warning,
    },
    rejectedBanner: {
      backgroundColor: '#ef444410',
      borderTopColor: theme.colors.error,
    },
    warningText: {
      flex: 1,
      color: theme.colors.warning,
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    pendingBanner: {
      backgroundColor: '#f59e0b10',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.warning,
    },
    pendingText: {
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flex: 1,
    },
  });

export default MyListingCard;
