/**
 * Map Search Screen
 * Full-screen map with listing pins
 * Uses MapLibre (requires development build)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MapView, Camera, PointAnnotation, MarkerView } from '@maplibre/maplibre-react-native';
import { MapPin } from 'lucide-react-native';
import { Text, Image } from '../src/components/slices';
import { useTheme, Theme } from '../src/theme';
import { useListingsStore } from '../src/stores/listingsStore';
import { getListingImageUrl } from '../src/utils/cloudflare-images';

// Syria province center coordinates
const SYRIA_PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  damascus: { lat: 33.5138, lng: 36.2765 },
  aleppo: { lat: 36.2021, lng: 37.1343 },
  homs: { lat: 34.7298, lng: 36.7184 },
  hama: { lat: 35.1324, lng: 36.7540 },
  latakia: { lat: 35.5304, lng: 35.7850 },
  tartous: { lat: 34.8899, lng: 35.8869 },
  daraa: { lat: 32.6189, lng: 36.1021 },
  sweida: { lat: 32.7088, lng: 36.5698 },
  quneitra: { lat: 33.1261, lng: 35.8246 },
  idlib: { lat: 35.9248, lng: 36.6333 },
  raqqa: { lat: 35.9505, lng: 39.0089 },
  deir_ez_zor: { lat: 35.3364, lng: 40.1407 },
  hasakah: { lat: 36.5024, lng: 40.7478 },
  rif_damascus: { lat: 33.6844, lng: 36.5135 },
};

const SYRIA_CENTER: [number, number] = [38.0, 34.8]; // [lng, lat]
const DEFAULT_ZOOM = 6;

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price: number;
  image: string | null;
}

export default function MapSearchScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; listingType?: string }>();
  const category = params.category || '';
  const listingType = params.listingType || 'sell';

  const { fetchListings, listings, isLoading } = useListingsStore();
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Fetch listings
  useEffect(() => {
    fetchListings({
      categoryId: category,
      listingType: listingType === 'rent' ? 'RENT' : 'SALE',
    });
  }, [category, listingType]);

  // Build markers from all listings
  const markers = useMemo((): MapMarker[] => {
    return listings.map((l) => {
      let lat = l.location?.coordinates?.lat;
      let lng = l.location?.coordinates?.lng;

      if (!lat || !lng) {
        const province = l.location?.province?.toLowerCase();
        if (province && SYRIA_PROVINCE_COORDS[province]) {
          lat = SYRIA_PROVINCE_COORDS[province].lat + (Math.random() - 0.5) * 0.03;
          lng = SYRIA_PROVINCE_COORDS[province].lng + (Math.random() - 0.5) * 0.03;
        }
      }

      if (!lat || !lng) return null;

      return {
        id: l.id,
        lat,
        lng,
        title: l.title,
        price: l.priceMinor,
        image: l.imageKeys?.[0] ? getListingImageUrl(l.imageKeys[0], 'card') : null,
      };
    }).filter(Boolean) as MapMarker[];
  }, [listings]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'البحث على الخريطة',
          headerStyle: { backgroundColor: theme.colors.bg },
          headerShadowVisible: true,
          headerBackVisible: true,
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: theme.colors.text,
          headerRight: () => (
            <Text variant="small" color="muted">
              {isLoading ? 'جاري البحث...' : `${markers.length} إعلان`}
            </Text>
          ),
        }}
      />

      <View style={styles.container}>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            mapStyle="https://tiles.openfreemap.org/styles/liberty"
            attributionEnabled={false}
            logoEnabled={false}
          >
            <Camera
              centerCoordinate={SYRIA_CENTER}
              zoomLevel={DEFAULT_ZOOM}
              animationMode="moveTo"
            />

            {/* Pins */}
            {markers.map((m) => (
              <PointAnnotation
                key={m.id}
                id={m.id}
                coordinate={[m.lng, m.lat]}
                onSelected={() => setSelectedMarker(m)}
              >
                <View style={styles.pinContainer}>
                  <MapPin size={24} color={theme.colors.primary} fill={theme.colors.primary} />
                </View>
              </PointAnnotation>
            ))}

            {/* Popup card - rendered as MarkerView at pin coordinate */}
            {selectedMarker && (
              <MarkerView
                coordinate={[selectedMarker.lng, selectedMarker.lat]}
                anchor={{ x: 0.5, y: 1 }}
                allowOverlap={true}
              >
                <TouchableOpacity
                  style={styles.popupCard}
                  onPress={() => router.push(`/listing/${selectedMarker.id}`)}
                  activeOpacity={0.9}
                >
                  {selectedMarker.image && (
                    <Image
                      src={selectedMarker.image}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.cardContent}>
                    <Text variant="small" numberOfLines={2} style={styles.cardTitle}>
                      {selectedMarker.title}
                    </Text>
                    <Text variant="body" color="primary">
                      ${(selectedMarker.price / 100).toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              </MarkerView>
            )}
          </MapView>
        </View>
      </View>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    pinContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Popup above pin
    popupCard: {
      width: 160,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      ...theme.shadows.lg,
      elevation: 5,
    },
    cardImage: {
      width: '100%',
      aspectRatio: 4 / 3,
    },
    cardContent: {
      padding: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    cardTitle: {
      fontWeight: '600' as const,
      fontSize: 13,
    },
  });
