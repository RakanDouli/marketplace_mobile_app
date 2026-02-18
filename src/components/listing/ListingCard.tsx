/**
 * ListingCard Component
 * Card component for displaying listings matching web frontend design
 * Delegates to separate components based on viewMode
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { Image } from '../slices/Image';
import { ShareButton } from './ShareButton';
import { FavoriteButton } from './FavoriteButton';
import { ListingCardGrid } from './ListingCardGrid';
import { ListingCardList } from './ListingCardList';
import { ENV } from '../../constants/env';

export type ListingCardViewMode = 'grid' | 'list' | 'compact';

export interface ListingCardProps {
  id: string;
  title: string;
  price: string;
  location?: string;
  specs?: string;
  /** Detailed specs with labels for list view */
  specsDisplay?: Record<string, any>;
  /** Single image ID or URL */
  image?: string;
  /** Pre-optimized image URL */
  imageUrl?: string;
  /** Array of image IDs */
  images?: string[];
  /** User ID of the listing owner - used to hide favorite button if user owns listing */
  userId?: string;
  /** Category slug for share URL */
  categorySlug?: string;
  /** Listing type slug for share URL (sell/rent) */
  listingType?: string;
  onPress?: () => void;
  isFeatured?: boolean;
  viewMode?: ListingCardViewMode;
  style?: ViewStyle;
}

export function ListingCard({
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
  categorySlug,
  listingType = 'sell',
  onPress,
  isFeatured = false,
  viewMode = 'grid',
  style,
}: ListingCardProps) {
  const theme = useTheme();

  // Construct share URL for web frontend
  const shareUrl = useMemo(() => {
    if (categorySlug) {
      return `${ENV.WEB_URL}/${categorySlug}/${listingType}/${id}`;
    }
    return `${ENV.WEB_URL}/listing/${id}`;
  }, [categorySlug, listingType, id]);

  // Grid view - delegates to ListingCardGrid
  if (viewMode === 'grid') {
    return (
      <ListingCardGrid
        id={id}
        title={title}
        price={price}
        location={location}
        specs={specs}
        image={image}
        imageUrl={imageUrlProp}
        images={images}
        userId={userId}
        shareUrl={shareUrl}
        onPress={onPress}
        isFeatured={isFeatured}
        style={style}
      />
    );
  }

  // List view - delegates to ListingCardList
  if (viewMode === 'list') {
    return (
      <ListingCardList
        id={id}
        title={title}
        price={price}
        location={location}
        specs={specs}
        specsDisplay={specsDisplay}
        image={image}
        imageUrl={imageUrlProp}
        images={images}
        userId={userId}
        onPress={onPress}
        isFeatured={isFeatured}
      />
    );
  }

  // Compact view - minimal card for sliders (kept inline)
  const styles = useMemo(() => createCompactStyles(theme), [theme]);

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
      <View style={styles.imageContainer}>
        <Image
          src={imageSrc}
          variant="thumbnail"
          aspectRatio={4 / 3}
          borderRadius={theme.radius.xl}
        />
        <View style={styles.imageActions}>
          <ShareButton
            metadata={{
              title,
              description: specs,
              url: shareUrl,
              price,
              imageUrl: imageSrc || undefined,
            }}
          />
          <FavoriteButton
            listingId={id}
            listingUserId={userId}
          />
        </View>
      </View>
      <View style={styles.content}>
        <Text variant="small" numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        <Text variant="h4" color="primary" style={styles.price}>
          {price}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createCompactStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    imageContainer: {
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
    },
    imageActions: {
      position: 'absolute',
      bottom: theme.spacing.sm,
      right: theme.spacing.sm,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    content: {
      padding: theme.spacing.sm,
    },
    title: {
      marginBottom: theme.spacing.xs,
      textAlign: 'right',
    },
    price: {
      textAlign: 'right',
    },
  });

export default ListingCard;
