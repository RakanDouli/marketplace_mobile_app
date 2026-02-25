/**
 * OwnerCard Component
 * Displays listing owner/seller information with rating and review button
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  User,
  Building2,
  Star,
  ChevronLeft,
  BadgeCheck,
  Calendar,
  Flag,
} from 'lucide-react-native';
import { Text, Button } from '../slices';
import { useTheme, Theme } from '../../theme';
import { useListingOwnerStore, ListingOwner } from '../../stores/listingOwnerStore';
import { getCloudflareImageUrl } from '../../services/cloudflare/images';
import { formatMonthYear } from '../../utils';

interface OwnerCardProps {
  userId: string;
  onViewReviews?: () => void;
  onReport?: () => void;
}

export function OwnerCard({ userId, onViewReviews, onReport }: OwnerCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const { owner, isLoading, fetchOwner } = useListingOwnerStore();

  useEffect(() => {
    if (userId) {
      fetchOwner(userId);
    }
  }, [userId]);

  // Format member since date
  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return '';
    return formatMonthYear(dateString);
  };

  // Render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      const filled = i < fullStars || (i === fullStars && hasHalfStar);
      stars.push(
        <Star
          key={i}
          size={14}
          color={filled ? theme.colors.warning : theme.colors.border}
          fill={filled ? theme.colors.warning : 'transparent'}
        />
      );
    }
    return stars;
  };

  if (isLoading || !owner) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeleton, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.skeletonAvatar} />
          <View style={[styles.skeletonText, { alignItems: theme.isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '40%' }]} />
          </View>
        </View>
      </View>
    );
  }

  const isBusiness = owner.accountType === 'business' || owner.accountType === 'dealer';
  const displayName = owner.companyName || owner.name || 'البائع';
  const hasAvatar = owner.avatar;

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={[styles.header, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {hasAvatar ? (
            <Image
              source={{ uri: getCloudflareImageUrl(owner.avatar!, 'thumbnail') }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              {isBusiness ? (
                <Building2 size={28} color={theme.colors.primary} />
              ) : (
                <User size={28} color={theme.colors.primary} />
              )}
            </View>
          )}
          {owner.businessVerified && (
            <View style={styles.verifiedBadge}>
              <BadgeCheck size={16} color={theme.colors.primary} fill={theme.colors.bg} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={[styles.info, { alignItems: theme.isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={styles.nameRow}>
            <Text variant="body" bold numberOfLines={1} style={styles.name}>
              {displayName}
            </Text>
          </View>

          {isBusiness && (
            <Text variant="xs" color="secondary" style={styles.accountType}>
              {owner.accountType === 'dealer' ? 'معرض سيارات' : 'حساب تجاري'}
            </Text>
          )}

          {/* Rating */}
          {owner.reviewCount != null && owner.reviewCount > 0 ? (
            <TouchableOpacity
              style={[styles.ratingRow, { flexDirection: theme.isRTL ? 'row' : 'row-reverse' }]}
              onPress={onViewReviews}
              activeOpacity={0.7}
            >
              <View style={styles.stars}>
                {renderStars(owner.averageRating || 0)}
              </View>
              <Text variant="xs" color="secondary" style={styles.ratingText}>
                {`${(owner.averageRating || 0).toFixed(1)} (${owner.reviewCount} تقييم)`}
              </Text>
              <ChevronLeft
                size={14}
                color={theme.colors.textMuted}
                style={{ transform: [{ scaleX: theme.isRTL ? 1 : -1 }] }}
              />
            </TouchableOpacity>
          ) : (
            <Text variant="xs" color="muted" style={styles.noReviews}>
              لا توجد تقييمات بعد
            </Text>
          )}

          {/* Member since */}
          {owner.createdAt && (
            <View style={[styles.memberSince, { flexDirection: theme.isRTL ? 'row' : 'row-reverse' }]}>
              <Text variant="xs" color="muted">
                {`عضو منذ ${formatMemberSince(owner.createdAt)}`}
              </Text>
              <Calendar size={12} color={theme.colors.textMuted} />
            </View>
          )}
        </View>
      </View>

      {/* Actions - stacked vertically */}
      <View style={styles.actions}>
        {/* Reviews button - only if has reviews */}
        {owner.reviewCount != null && owner.reviewCount > 0 && onViewReviews && (
          <Button
            variant="outline"
            size="sm"
            onPress={onViewReviews}
            fullWidth
          >
            عرض التقييمات
          </Button>
        )}

        {/* Report button - link style with flag icon, below reviews */}
        {onReport && (
          <Button
            variant="link"
            size="sm"
            onPress={onReport}
            icon={<Flag size={14} color={theme.colors.error} />}
            textStyle={styles.reportButtonText}
          >
            الإبلاغ
          </Button>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },

    // Header
    header: {
      gap: theme.spacing.md,
    },

    // Avatar
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.bg,
    },
    avatarPlaceholder: {
      width: 64,
      height: 64,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    verifiedBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
    },

    // Info
    info: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    name: {
      textAlign: 'right',
    },
    accountType: {
      marginTop: theme.spacing.xs / 2,
    },
    ratingRow: {
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    stars: {
      flexDirection: 'row',
      gap: theme.spacing.xs / 2,
    },
    ratingText: {
      marginStart: theme.spacing.xs,
    },
    noReviews: {
      marginTop: theme.spacing.xs,
    },
    memberSince: {
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      gap: theme.spacing.xs,
    },

    // Actions - vertical layout
    actions: {
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    reportButtonText: {
      color: theme.colors.error,
      textTransform: 'none',
    },

    // Skeleton
    skeleton: {
      gap: theme.spacing.md,
    },
    skeletonAvatar: {
      width: 64,
      height: 64,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border,
    },
    skeletonText: {
      flex: 1,
      gap: theme.spacing.sm,
    },
    skeletonLine: {
      height: 14,
      backgroundColor: theme.colors.border,
      borderRadius: theme.radius.sm,
    },
  });

export default OwnerCard;
