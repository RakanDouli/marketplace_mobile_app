/**
 * ListingCardGrid Component
 * Vertical grid view card for listings
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { Image } from '../slices/Image';
import { ShareButton } from './ShareButton';
import { FavoriteButton } from './FavoriteButton';

interface ListingCardGridProps {
  id: string;
  title: string;
  price: string;
  location?: string;
  specs?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  userId?: string;
  shareUrl: string;
  onPress?: () => void;
  isFeatured?: boolean;
  style?: ViewStyle;
}

export function ListingCardGrid({
  id,
  title,
  price,
  location,
  specs,
  image,
  imageUrl: imageUrlProp,
  images,
  userId,
  shareUrl,
  onPress,
  isFeatured = false,
  style,
}: ListingCardGridProps) {
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
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          src={imageSrc}
          variant="card"
          aspectRatio={4 / 3}
          borderRadius={0}
        />

        {isFeatured && (
          <View style={styles.featuredBadge}>
            <Star size={10} color="#FFF" fill="#FFF" />
            <Text variant="xs" bold style={styles.featuredBadgeText}>
              مميز
            </Text>
          </View>
        )}

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
        <Text variant="h4" numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        <Text variant="h4" color="primary" style={styles.price}>
          {price}
        </Text>
        {specs && (
          <Text variant="xs" color="secondary" numberOfLines={2} style={styles.specs}>
            {specs}
          </Text>
        )}
        {location && (
          <View style={styles.location}>
            <Text variant="xs" color="secondary" style={styles.locationText}>
              {location}
            </Text>
            <MapPin size={14} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
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
    featuredBadge: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
      gap: theme.spacing.xs,
    },
    featuredBadgeText: {
      color: '#FFFFFF',
    },
    content: {
      padding: theme.spacing.md,
    },
    title: {
      marginBottom: theme.spacing.xs,
      textAlign: 'right',
    },
    price: {
      marginBottom: theme.spacing.xs,
      textAlign: 'right',
    },
    location: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.xs,
    },
    locationText: {
      flex: 0,
    },
    specs: {
      marginBottom: theme.spacing.xs,
      opacity: 0.8,
      textAlign: 'right',
    },
  });

export default ListingCardGrid;
