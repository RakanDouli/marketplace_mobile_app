/**
 * ListingCardList Component
 * Horizontal list view card for listings
 * Clean design inspired by Dubizzle/Sahibinden
 */

import React, { useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text, IconText, Image } from '../slices';
import { FavoriteButton } from './FavoriteButton';

interface ListingCardListProps {
  id: string;
  title: string;
  price: string;
  location?: string;
  specs?: string; // Compact format for fallback
  specsDisplay?: Record<string, any>; // Detailed format with labels
  image?: string;
  imageUrl?: string;
  images?: string[];
  userId?: string;
  onPress?: () => void;
  isFeatured?: boolean;
}

export const ListingCardList = memo(function ListingCardList({
  id,
  title,
  price,
  location,
  specs,
  specsDisplay,
  image,
  imageUrl: imageUrlProp,
  images,
  userId,
  onPress,
  isFeatured = false,
}: ListingCardListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Image corner style for RTL
  const imageCornerStyle = theme.isRTL
    ? { borderTopRightRadius: theme.radius.lg, borderBottomRightRadius: theme.radius.lg }
    : { borderTopLeftRadius: theme.radius.lg, borderBottomLeftRadius: theme.radius.lg };
  const badgePosition = theme.isRTL ? { right: theme.spacing.xs } : { left: theme.spacing.xs };
  const favoritePosition = theme.isRTL ? { right: theme.spacing.xs } : { left: theme.spacing.xs };

  // Get the image source
  const imageSrc = useMemo(() => {
    if (imageUrlProp) return imageUrlProp;
    if (image) return image;
    if (images && images.length > 0) return images[0];
    return null;
  }, [imageUrlProp, image, images]);

  return (
    <TouchableOpacity
      style={[styles.card, theme.isRTL ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image - 35% width, full card height, rounded on start side */}
      <View style={[styles.imageContainer, imageCornerStyle]}>
        <Image
          src={imageSrc}
          variant="small"
          width="100%"
          height="100%"
          borderRadius={0}
        />
        {isFeatured && (
          <View style={[styles.featuredBadge, badgePosition]}>
            <Text variant="xs" bold style={styles.featuredBadgeText}>
              مميز
            </Text>
          </View>
        )}
        {/* Favorite button - bottom of image on start side */}
        <View style={[styles.favoriteButtonWrapper, favoritePosition]}>
          <FavoriteButton
            listingId={id}
            listingUserId={userId}
            size={16}
          />
        </View>
      </View>

      {/* Content area */}
      <View style={styles.content}>
        {/* Title */}
        <Text variant="body" numberOfLines={2} style={styles.title}>
          {title}
        </Text>

        {/* Price */}
        <Text variant="h4" color="primary" style={styles.price}>
          {price}
        </Text>

        {/* Specs - backend decides what to show */}
        {specsDisplay && Object.keys(specsDisplay).length > 0 ? (
          <Text variant="xs" color="secondary" numberOfLines={2} style={styles.specs}>
            {[...new Set(
              Object.entries(specsDisplay)
                .filter(([key]) => key !== 'accountType' && key !== 'account_type')
                .map(([, value]) => {
                  if (!value) return null;
                  const displayValue = typeof value === 'object' ? value.value : value;
                  return displayValue || null;
                })
                .filter(Boolean)
            )]
              .map(v => `\u2068${v}\u2069`) // Wrap in Unicode isolates for BiDi
              .join(' | ')}
          </Text>
        ) : specs ? (
          <Text variant="xs" color="secondary" numberOfLines={2} style={styles.specs}>
            {specs}
          </Text>
        ) : null}

        {/* Location - icon position based on direction */}
        {location && (
          <IconText
            icon={<MapPin size={12} color={theme.colors.textMuted} />}
            text={location}
            variant="xs"
            color="muted"
          />
        )}
      </View>
    </TouchableOpacity>
  );
});

ListingCardList.displayName = 'ListingCardList';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 160,
      position: 'relative',
      ...theme.shadows.sm,
    },
    imageContainer: {
      width: '35%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.colors.surface,
      // Border radius applied dynamically based on direction
    },
    featuredBadge: {
      position: 'absolute',
      top: theme.spacing.xs,
      // left/right applied dynamically
      backgroundColor: theme.colors.primary,
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.radius.sm,
    },
    featuredBadgeText: {
      color: theme.colors.textInverse,
      fontSize: 10,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
      paddingStart: theme.spacing.lg,
      justifyContent: 'center',
    },
    title: {
      marginBottom: theme.spacing.xs,
      fontWeight: '600',
      lineHeight: 20,
    },
    price: {
      marginBottom: theme.spacing.xs,
    },
    specs: {
      marginBottom: theme.spacing.xs,
      opacity: 0.7,
    },
    favoriteButtonWrapper: {
      position: 'absolute',
      bottom: theme.spacing.xs,
      // left/right applied dynamically
    },
  });

export default memo(ListingCardList);
