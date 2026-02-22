/**
 * RelatedListings Component
 * Fetches and displays related listings by brand or price
 * Uses Slider or Grid slice for layout
 */

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Slider, Grid } from '../slices';
import { ListingCard } from './ListingCard';
import { useRelatedListingsStore, RelatedListing } from '../../stores/relatedListingsStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatPrice, formatLocation } from '../../utils';

export type RelatedType = 'brand' | 'price';
export type LayoutMode = 'slider' | 'grid';

interface RelatedListingsProps {
  listingId: string;
  type: RelatedType;
  title?: string;
  maxItems?: number;
  onViewAll?: () => void;
  layout?: LayoutMode;
}

export function RelatedListings({
  listingId,
  type,
  title,
  maxItems,
  onViewAll,
  layout = 'slider',
}: RelatedListingsProps) {
  const router = useRouter();

  const {
    byBrand,
    byPrice,
    isLoadingBrand,
    isLoadingPrice,
    fetchRelatedByBrand,
    fetchRelatedByPrice,
  } = useRelatedListingsStore();

  const preferredCurrency = useCurrencyStore((state) => state.preferredCurrency);

  // Determine which data to use
  const listings = type === 'brand' ? byBrand : byPrice;
  const isLoading = type === 'brand' ? isLoadingBrand : isLoadingPrice;

  // Fetch on mount
  useEffect(() => {
    if (listingId) {
      if (type === 'brand') {
        fetchRelatedByBrand(listingId, maxItems || 6);
      } else {
        fetchRelatedByPrice(listingId, maxItems || 6);
      }
    }
  }, [listingId, type, maxItems]);

  // Get default title
  const sectionTitle = title || (type === 'brand' ? 'من نفس الماركة' : 'بسعر مشابه');

  // Handle listing press
  const handleListingPress = useCallback((listing: RelatedListing) => {
    router.push(`/listing/${listing.id}`);
  }, [router]);

  // Format specs from specsDisplay
  const formatSpecs = useCallback((specsDisplay: Record<string, any> | undefined): string => {
    if (!specsDisplay) return '';
    const specsArray: string[] = [];
    Object.values(specsDisplay).forEach((spec: any) => {
      if (spec?.value) {
        const value = typeof spec.value === 'object' ? spec.value : String(spec.value);
        if (typeof value === 'string') specsArray.push(value);
      }
    });
    return specsArray.slice(0, 3).join(' • ');
  }, []);

  // Render listing card
  const renderCard = useCallback((item: RelatedListing) => {
    const location = formatLocation(item.location);
    const price = formatPrice(item.priceMinor, preferredCurrency);
    const specs = formatSpecs(item.specsDisplay);

    return (
      <ListingCard
        id={item.id}
        title={item.title}
        price={price}
        location={location}
        specs={specs}
        specsDisplay={item.specsDisplay}
        images={item.imageKeys}
        categorySlug={item.category?.slug}
        listingType={item.listingType}
        viewMode="grid"
        onPress={() => handleListingPress(item)}
      />
    );
  }, [preferredCurrency, formatSpecs, handleListingPress]);

  // Don't render if no listings and not loading
  if (!isLoading && listings.length === 0) {
    return null;
  }

  // Slider layout
  if (layout === 'slider') {
    return (
      <Slider
        data={listings}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        title={sectionTitle}
        onViewAll={onViewAll}
        isLoading={isLoading}
        cardWidth={180}
        paddingY="md"
      />
    );
  }

  // Grid layout
  return (
    <Grid
      title={sectionTitle}
      onViewAll={onViewAll}
      columns={2}
      mobileColumns={2}
      gap="md"
      paddingY="md"
      isLoading={isLoading}
    >
      {listings.map((item) => renderCard(item))}
    </Grid>
  );
}

export default RelatedListings;
