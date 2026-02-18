/**
 * Wishlist Screen
 * Shows user's favorite listings
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, Theme } from '../../../src/theme';
import { Text } from '../../../src/components/slices/Text';
import { ListingCard } from '../../../src/components/listing';
import { useWishlistStore, WishlistListing } from '../../../src/stores/wishlistStore';
import { useUserAuthStore } from '../../../src/stores/userAuthStore';
import { useCurrencyStore } from '../../../src/stores/currencyStore';
import { getListingImageUrl } from '../../../src/services/cloudflare/images';
import { formatPrice } from '../../../src/utils/formatPrice';

export default function WishlistScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isAuthenticated } = useUserAuthStore();
  const {
    listings,
    isLoading,
    isInitialized,
    loadMyWishlist,
  } = useWishlistStore();
  const { preferredCurrency } = useCurrencyStore();

  // Load wishlist on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadMyWishlist();
    }
  }, [isAuthenticated]);

  // Handle pull to refresh
  const handleRefresh = () => {
    if (isAuthenticated) {
      loadMyWishlist();
    }
  };

  // Navigate to listing detail
  const handleListingPress = (listing: WishlistListing) => {
    const categorySlug = listing.category?.slug || 'cars';
    router.push(`/(tabs)/search/${categorySlug}/sell/${listing.id}`);
  };

  // Get image URL from imageKeys
  const getImageUrl = (imageKeys: string[] | undefined): string | undefined => {
    if (!imageKeys || imageKeys.length === 0) {
      return undefined;
    }
    return getListingImageUrl(imageKeys[0], 'card');
  };

  // Render listing card
  const renderItem = ({ item }: { item: WishlistListing }) => {
    const categorySlug = item.category?.slug || 'cars';

    return (
      <View style={styles.cardWrapper}>
        <ListingCard
          id={item.id}
          title={item.title}
          price={formatPrice(item.priceMinor, preferredCurrency)}
          imageUrl={getImageUrl(item.imageKeys)}
          userId={item.user?.id}
          categorySlug={categorySlug}
          listingType="sell"
          onPress={() => handleListingPress(item)}
          viewMode="grid"
        />
      </View>
    );
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Heart size={64} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
          قم بتسجيل الدخول
        </Text>
        <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
          سجل دخولك لعرض المفضلة الخاصة بك
        </Text>
      </View>
    );
  }

  // Show loading state on first load
  if (!isInitialized && isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="paragraph" color="muted" style={{ marginTop: 16 }}>
          جاري تحميل المفضلة...
        </Text>
      </View>
    );
  }

  // Show empty state
  if (listings.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Heart size={64} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
          لا توجد مفضلات
        </Text>
        <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
          أضف إعلانات إلى المفضلة لتظهر هنا
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with count */}
      <View style={styles.header}>
        <Text variant="h4" style={styles.headerText}>
          {listings.length} إعلان في المفضلة
        </Text>
      </View>

      {/* Listings grid */}
      <FlatList
        data={listings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    header: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerText: {
      textAlign: 'right',
    },
    listContent: {
      padding: theme.spacing.sm,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    cardWrapper: {
      width: '48.5%',
      marginBottom: theme.spacing.md,
    },
  });
