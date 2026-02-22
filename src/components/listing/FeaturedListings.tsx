/**
 * FeaturedListings Component
 * Displays featured listings using Slider or Grid layout
 * Uses shared layout slices for consistency
 */

import React, { useCallback } from 'react';
import { Slider, Grid, ContainerProps } from '../slices';
import { ListingCard } from './ListingCard';
import { Listing } from '../../stores/listingsStore';
import { formatLocation } from '../../utils';

export type FeaturedListingsVariant = 'slider' | 'grid';

export interface FeaturedListingsProps {
  listings: Listing[];
  title?: string;
  viewAllText?: string;
  onViewAll?: () => void;
  onListingPress?: (listingId: string) => void;
  variant?: FeaturedListingsVariant;
  columns?: 2 | 3 | 4;
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
  // Format price for display
  const formatPrice = (priceMinor: number): string => {
    const price = priceMinor / 100;
    return `${price.toLocaleString('en-US')} ل.س`;
  };

  // Format specs for display
  const formatSpecs = (specsDisplay: Record<string, any> | string | undefined): string => {
    if (!specsDisplay) return '';

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

    const partsSet = new Set<string>();
    Object.entries(specs)
      .filter(([key]) => key !== 'accountType' && key !== 'account_type')
      .forEach(([, value]) => {
        if (!value) return;
        const displayValue = typeof value === 'object' ? value.value : value;
        if (displayValue && displayValue !== '') {
          partsSet.add(String(displayValue));
        }
      });

    return Array.from(partsSet).map(p => `\u2068${p}\u2069`).join(' | ');
  };

  // Render listing card
  const renderCard = useCallback((listing: Listing) => (
    <ListingCard
      id={listing.id}
      title={listing.title}
      price={formatPrice(listing.priceMinor)}
      location={formatLocation(listing.location)}
      specs={formatSpecs(listing.specsDisplay)}
      specsDisplay={listing.specsDisplay}
      images={listing.imageKeys}
      userId={listing.user?.id}
      categorySlug={listing.category?.slug}
      listingType={listing.listingType}
      onPress={() => onListingPress?.(listing.id)}
      viewMode="grid"
    />
  ), [onListingPress]);

  // Limit listings
  const displayListings = listings.slice(0, limit);

  // Empty state
  if (!isLoading && (!listings || listings.length === 0)) {
    return null;
  }

  // Slider layout
  if (variant === 'slider') {
    return (
      <Slider
        data={displayListings}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        title={title}
        viewAllText={viewAllText}
        onViewAll={onViewAll}
        isLoading={isLoading}
        cardWidth={180}
        paddingY={paddingY}
        background={background}
      />
    );
  }

  // Grid layout
  return (
    <Grid
      title={title}
      viewAllText={viewAllText}
      onViewAll={onViewAll}
      columns={columns}
      mobileColumns={2}
      gap="md"
      paddingY={paddingY}
      background={background}
      isLoading={isLoading}
    >
      {displayListings.map((listing) => renderCard(listing))}
    </Grid>
  );
}

export default FeaturedListings;
