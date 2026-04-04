/**
 * FavoriteButton Component
 * Handles toggling wishlist with proper auth check
 * Matches web frontend FavoriteButton pattern
 */

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useUserAuthStore } from '../../stores/userAuthStore';
import { AuthRequiredModal } from '../AuthRequiredModal';

interface FavoriteButtonProps {
  listingId: string;
  listingUserId?: string;
  size?: number;
  style?: 'overlay' | 'inline';
}

export function FavoriteButton({
  listingId,
  listingUserId,
  size = 16,
  style = 'overlay',
}: FavoriteButtonProps) {
  const theme = useTheme();
  const styles = createStyles(theme, style);

  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isAuthenticated, isLoading: authLoading, profile } = useUserAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Hide button while auth is loading (prevent flash before we know if user owns listing)
  if (authLoading) {
    return null;
  }

  // Hide button if user owns this listing
  // Use profile.id (backend database ID) instead of user.id (Supabase auth ID)
  const isOwner = profile && listingUserId && profile.id === listingUserId;
  if (isOwner) {
    return null;
  }

  const isFavorited = isInWishlist(listingId);

  const handleToggle = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Prevent double-tap
    if (isLoading) return;

    setIsLoading(true);

    try {
      await toggleWishlist(listingId);
    } catch (error: any) {
      // Log error but don't throw - prevents Android RTL issues
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleToggle}
        style={styles.button}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.text} />
        ) : (
          <Heart
            size={size}
            color={isFavorited ? theme.colors.error : theme.colors.text}
            fill={isFavorited ? theme.colors.error : 'transparent'}
          />
        )}
      </TouchableOpacity>
      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="سجّل دخولك لإضافة الإعلان إلى المفضلة"
        dismissible
      />
    </>
  );
}

const createStyles = (theme: Theme, style: 'overlay' | 'inline') =>
  StyleSheet.create({
    button: style === 'overlay' ? {
      width: theme.iconSize.lg,
      height: theme.iconSize.lg,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    } : {
      padding: theme.spacing.sm,
    },
  });

export default FavoriteButton;
