/**
 * ListingCardList Component
 * Horizontal list view card for listings
 * Clean design inspired by Dubizzle/Sahibinden
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { Image } from '../slices/Image';
import { FavoriteButton } from './FavoriteButton';

interface ListingCardListProps {
  id: string;
  title: string;
  price: string;
  location?: string;
  specs?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  userId?: string;
  onPress?: () => void;
  isFeatured?: boolean;
}

export function ListingCardList({
  id,
  title,
  price,
  location,
  specs,
  image,
  imageUrl: imageUrlProp,
  images,
  userId,
  onPress,
  isFeatured = false,
}: ListingCardListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Get the image source
  const imageSrc = useMemo(() => {
    if (imageUrlProp) return imageUrlProp;
    if (image) return image;
    if (images && images.length > 0) return images[0];
    return null;
  }, [imageUrlProp, image, images]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image - 35% width, full card height, rounded on right side (RTL) */}
      <View style={styles.imageContainer}>
        <Image
          src={imageSrc}
          variant="small"
          width="100%"
          height="100%"
          borderRadius={0}
        />
        {isFeatured && (
          <View style={styles.featuredBadge}>
            <Text variant="xs" bold style={styles.featuredBadgeText}>
              مميز
            </Text>
          </View>
        )}
        {/* Favorite button - bottom right of image */}
        <View style={styles.favoriteButtonWrapper}>
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

        {/* Specs - two lines for more visibility */}
        {specs && (
          <Text variant="xs" color="secondary" numberOfLines={2} style={styles.specs}>
            {specs}
          </Text>
        )}

        {/* Location - icon before text in RTL */}
        {location && (
          <View style={styles.location}>
            <Text variant="xs" color="muted" numberOfLines={1}>
              {location}
            </Text>
            <MapPin size={12} color={theme.colors.textMuted} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 145,
      position: 'relative',
      ...theme.shadows.sm,
    },
    imageContainer: {
      width: '35%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.colors.surface,
      // Rounded corners on right side (RTL image is on right)
      borderTopRightRadius: theme.radius.lg,
      borderBottomRightRadius: theme.radius.lg,
    },
    featuredBadge: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.radius.sm,
    },
    featuredBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
      paddingStart: theme.spacing.lg,
      justifyContent: 'center',
    },
    title: {
      textAlign: 'right',
      marginBottom: theme.spacing.xs,
      fontWeight: '600',
      lineHeight: 20,
    },
    price: {
      textAlign: 'right',
      marginBottom: theme.spacing.xs,
    },
    specs: {
      textAlign: 'right',
      marginBottom: theme.spacing.xs,
      opacity: 0.7,
    },
    location: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.xs,
    },
    favoriteButtonWrapper: {
      position: 'absolute',
      bottom: theme.spacing.xs,
      right: theme.spacing.xs,
    },
  });

export default ListingCardList;
