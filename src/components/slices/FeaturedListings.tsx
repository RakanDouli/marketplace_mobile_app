/**
 * FeaturedListings Component
 * Listing grid/slider - matches web frontend FeaturedListings
 */

import React, { useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Container, ContainerProps } from './Container';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { ListingCard } from '../ui/ListingCard';
import { Loading } from '../ui/Loading';
import { Listing } from '../../stores/listingsStore';
import { getListingImageUrl } from '../../services/cloudflare/images';

export type FeaturedListingsVariant = 'slider' | 'grid';

export interface FeaturedListingsProps {
  listings: Listing[];
  title?: string;
  viewAllText?: string;
  onViewAll?: () => void;
  onListingPress?: (listingId: string) => void;
  variant?: FeaturedListingsVariant;
  columns?: 2 | 3 | 4 | 5;
  isLoading?: boolean;
  limit?: number;
  paddingY?: ContainerProps['paddingY'];
  background?: ContainerProps['background'];
}

export function FeaturedListings({
  listings,
  title = 'إعلانات جديدة',
  viewAllText = 'عرض الكل',
  onViewAll,
  onListingPress,
  variant = 'slider',
  columns = 2,
  isLoading = false,
  limit = 10,
  paddingY = 'lg',
  background = 'transparent',
}: FeaturedListingsProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Responsive columns
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const effectiveColumns = isDesktop ? Math.min(columns + 1, 5) : isTablet ? Math.min(columns, 4) : 2;

  // Card width calculation
  const containerPadding = theme.spacing.md * (isDesktop ? 3 : isTablet ? 2 : 1);
  const gap = theme.spacing.md;
  const cardWidth = variant === 'slider'
    ? 180 // Fixed width for horizontal scroll
    : (width - containerPadding * 2 - gap * (effectiveColumns - 1)) / effectiveColumns;

  // Format price for display
  const formatPrice = (priceMinor: number): string => {
    const price = priceMinor / 100;
    return `${price.toLocaleString('ar-SY')} ل.س`;
  };

  // Get listing image URL
  const getImage = (imageKeys: string[]): string | undefined => {
    if (!imageKeys || imageKeys.length === 0) return undefined;
    return getListingImageUrl(imageKeys[0], 'thumbnail');
  };

  // Format specs for display - matching web frontend pattern
  const formatSpecs = (specsDisplay: Record<string, any> | string | undefined): string => {
    if (!specsDisplay) return '';

    // Parse if string
    let specs: Record<string, any> = {};
    try {
      if (typeof specsDisplay === 'string') {
        specs = JSON.parse(specsDisplay);
      } else if (typeof specsDisplay === 'object') {
        specs = specsDisplay;
      }
    } catch {
      return '';
    }

    // Extract values from specs (handles both { label, value } and direct values)
    const parts: string[] = [];
    Object.entries(specs)
      .filter(([key]) => key !== 'accountType' && key !== 'account_type')
      .forEach(([, value]) => {
        if (!value) return;
        const displayValue = typeof value === 'object' ? value.value : value;
        if (displayValue && displayValue !== '') {
          parts.push(String(displayValue));
        }
      });

    return parts.join(' | ');
  };

  // Format location for display - matching web frontend pattern
  const formatLocation = (location?: { province?: string; city?: string }): string => {
    if (!location) return '';
    const { city, province } = location;
    // Format: "city، province" or just "province" or just "city"
    if (city && province) return `${city}، ${province}`;
    return city || province || '';
  };

  // Render individual listing card
  const renderListingCard = (listing: Listing, index: number) => (
    <ListingCard
      key={listing.id}
      id={listing.id}
      title={listing.title}
      price={formatPrice(listing.priceMinor)}
      location={formatLocation(listing.location)}
      specs={formatSpecs(listing.specsDisplay)}
      imageUrl={getImage(listing.imageKeys)}
      onPress={() => onListingPress?.(listing.id)}
      style={{ width: cardWidth }}
    />
  );

  // Loading state
  if (isLoading && listings.length === 0) {
    return (
      <Container paddingY={paddingY} background={background}>
        <View style={styles.header}>
          <Text variant="h3">{title}</Text>
        </View>
        <View style={styles.loading}>
          <Loading type="svg" size="lg" />
        </View>
      </Container>
    );
  }

  // Empty state
  if (!listings || listings.length === 0) {
    return null;
  }

  const displayListings = listings.slice(0, limit);

  // Slider variant (horizontal scroll)
  if (variant === 'slider') {
    return (
      <Container paddingY={paddingY} paddingX="none" background={background}>
        <View style={[styles.header, { paddingHorizontal: theme.spacing.md }]}>
          {onViewAll && (
            <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
              <Text variant="paragraph" style={{ color: theme.colors.primary }}>
                {viewAllText}
              </Text>
              <ChevronLeft size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          <Text variant="h3">{title}</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={displayListings}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderListingCard(item, index)}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.md }}
          inverted // RTL support
        />
      </Container>
    );
  }

  // Grid variant
  return (
    <Container paddingY={paddingY} background={background}>
      <View style={styles.header}>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text variant="paragraph" style={{ color: theme.colors.primary }}>
              {viewAllText}
            </Text>
            <ChevronLeft size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        <Text variant="h3">{title}</Text>
      </View>
      <View style={[styles.grid, { gap }]}>
        {displayListings.map((listing, index) => renderListingCard(listing, index))}
      </View>
    </Container>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    loading: {
      paddingVertical: theme.spacing.xl + theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  });

export default FeaturedListings;
