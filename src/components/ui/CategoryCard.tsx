/**
 * CategoryCard Component
 * Category card matching web frontend design with image backgrounds
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export interface CategoryCardProps {
  id: string;
  name: string;
  icon?: string;
  iconComponent?: React.ReactNode;
  backgroundImage?: string;
  count?: number | string;
  onPress?: () => void;
  size?: 'chip' | 'card' | 'large';
  /** Make the card fill its container width (for grid layouts) */
  fullWidth?: boolean;
}

export function CategoryCard({
  id,
  name,
  icon,
  iconComponent,
  backgroundImage,
  count,
  onPress,
  size = 'card',
  fullWidth = false,
}: CategoryCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Chip style - horizontal scrollable chips
  if (size === 'chip') {
    return (
      <TouchableOpacity
        style={styles.chipCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.chipIconContainer}>
          {iconComponent || (
            <View style={styles.chipIconPlaceholder} />
          )}
        </View>
        <Text variant="xs" style={styles.chipName}>
          {name}
        </Text>
      </TouchableOpacity>
    );
  }

  // Card with background image
  if (backgroundImage) {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          size === 'large' ? styles.largeCard : styles.mediumCard,
          fullWidth && styles.fullWidthCard,
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={{ uri: backgroundImage }}
          style={styles.cardImage}
          imageStyle={styles.cardImageStyle}
        >
          <View style={styles.cardOverlay}>
            <Text variant="h4" style={styles.cardName}>
              {name}
            </Text>
            {count !== undefined && (
              <Text variant="xs" style={styles.cardCount}>
                {count} إعلان
              </Text>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  // Card without image (icon only)
  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles.cardNoImage,
        size === 'large' ? styles.largeCard : styles.mediumCard,
        fullWidth && styles.fullWidthCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconOnlyContainer}>
        {iconComponent ? (
          iconComponent
        ) : icon ? (
          <Image
            source={{ uri: icon }}
            style={styles.iconImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
        <Text variant="small" bold style={styles.iconOnlyName}>
          {name}
        </Text>
        {count !== undefined && (
          <Text variant="xs" color="secondary" style={styles.iconOnlyCount}>
            {count}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Chip style (horizontal scroll)
    chipCard: {
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    chipIconContainer: {
      width: theme.layout.avatarSizeMd + theme.spacing.sm,
      height: theme.layout.avatarSizeMd + theme.spacing.sm,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    chipIconPlaceholder: {
      width: theme.iconSize.md,
      height: theme.iconSize.md,
      borderRadius: theme.iconSize.md / 2,
      backgroundColor: theme.colors.primary,
    },
    chipName: {
      color: theme.colors.text,
      textAlign: 'center',
    },

    // Card with image
    card: {
      borderRadius: theme.radius.xl,
      overflow: 'hidden',
    },
    mediumCard: {
      width: 140,
      height: 100,
      marginRight: theme.spacing.md,
    },
    largeCard: {
      width: 200,
      height: 140,
      marginRight: theme.spacing.md,
    },
    fullWidthCard: {
      width: '100%',
      height: 120,
      marginRight: 0,
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardImageStyle: {
      borderRadius: theme.radius.xl,
    },
    cardOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
      padding: theme.spacing.md,
    },
    cardName: {
      color: '#FFFFFF',
      fontFamily: theme.fontFamily.header,
    },
    cardCount: {
      color: 'rgba(255,255,255,0.85)',
      marginTop: theme.spacing.xs,
    },

    // Card without image
    cardNoImage: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconOnlyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    iconImage: {
      width: theme.iconSize.lg,
      height: theme.iconSize.lg,
    },
    iconPlaceholder: {
      width: theme.iconSize.lg,
      height: theme.iconSize.lg,
      borderRadius: theme.iconSize.lg / 2,
      backgroundColor: theme.colors.primary,
    },
    iconOnlyName: {
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    iconOnlyCount: {
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
  });

export default CategoryCard;
