/**
 * LocationMap Component
 * Displays an interactive MapLibre map with listing location
 * Falls back to province center coordinates when exact location unavailable
 *
 * NOTE: Requires a development build (eas build). Does NOT work in Expo Go.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { MapView, Camera, PointAnnotation } from '@maplibre/maplibre-react-native';
import { MapPin, Navigation, ExternalLink } from 'lucide-react-native';
import { Text, IconText } from '../slices';
import { useTheme, Theme } from '../../theme';
import { formatLocation as formatLocationUtil } from '../../utils';

interface Location {
  province?: string;
  city?: string;
  area?: string;
  link?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

interface LocationMapProps {
  location?: Location;
  title?: string;
}

/**
 * Syria province coordinates - verified centers
 * Matches web frontend OpenStreetMapProvider
 */
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

const PROVINCE_ARABIC_TO_ENGLISH: Record<string, string> = {
  'دمشق': 'damascus',
  'حلب': 'aleppo',
  'حمص': 'homs',
  'حماة': 'hama',
  'اللاذقية': 'latakia',
  'طرطوس': 'tartous',
  'درعا': 'daraa',
  'السويداء': 'sweida',
  'القنيطرة': 'quneitra',
  'إدلب': 'idlib',
  'الرقة': 'raqqa',
  'دير الزور': 'deir_ez_zor',
  'الحسكة': 'hasakah',
  'ريف دمشق': 'rif_damascus',
};

function getProvinceCoords(province?: string): { lat: number; lng: number } | null {
  if (!province) return null;
  const key = province.toLowerCase();
  if (SYRIA_PROVINCE_COORDS[key]) return SYRIA_PROVINCE_COORDS[key];
  const englishKey = PROVINCE_ARABIC_TO_ENGLISH[province];
  if (englishKey && SYRIA_PROVINCE_COORDS[englishKey]) return SYRIA_PROVINCE_COORDS[englishKey];
  return null;
}

/**
 * Extract coordinates from a Google Maps link
 */
function extractCoordsFromLink(link?: string): { lat: number; lng: number } | null {
  if (!link) return null;
  try {
    const qMatch = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    const queryMatch = link.match(/[?&]query=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
  } catch {
    // Parsing failed
  }
  return null;
}

/**
 * Resolve coordinates with fallback chain:
 * 1. Exact coordinates from location data
 * 2. Extracted from Google Maps link
 * 3. Province center coordinates
 */
function resolveCoords(location?: Location): { coords: { lat: number; lng: number }; zoom: number; isExact: boolean } | null {
  if (!location) return null;

  if (location.coordinates?.lat && location.coordinates?.lng) {
    return { coords: location.coordinates as { lat: number; lng: number }, zoom: 14, isExact: true };
  }

  const linkCoords = extractCoordsFromLink(location.link);
  if (linkCoords) {
    return { coords: linkCoords, zoom: 14, isExact: true };
  }

  const provinceCoords = getProvinceCoords(location.province);
  if (provinceCoords) {
    let zoom = 8;
    if (location.city) zoom = 11;
    if (location.area) zoom = 13;
    return { coords: provinceCoords, zoom, isExact: false };
  }

  return null;
}

export function LocationMap({ location, title }: LocationMapProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const formatLocation = () => {
    if (!location) return 'موقع غير محدد';
    if (location.city || location.area) {
      const formatted = formatLocationUtil({
        city: location.city || location.area,
        province: location.province,
      });
      return formatted || 'موقع غير محدد';
    }
    if (location.province) {
      const formatted = formatLocationUtil({ province: location.province });
      return formatted || location.province;
    }
    return 'موقع غير محدد';
  };

  const resolved = useMemo(() => resolveCoords(location), [location]);
  const hasLink = !!location?.link;

  const safeOpenURL = useCallback(async (url: string, fallbackUrl?: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else if (fallbackUrl) {
        await Linking.openURL(fallbackUrl);
      }
    } catch {
      if (fallbackUrl) {
        try { await Linking.openURL(fallbackUrl); } catch { /* silent */ }
      }
    }
  }, []);

  const openInMaps = useCallback(() => {
    if (location?.link) {
      safeOpenURL(location.link);
      return;
    }
    openWithCoordinatesOrSearch();
  }, [location, title]);

  const openWithCoordinatesOrSearch = useCallback(() => {
    if (!resolved?.coords || !resolved.isExact) {
      const query = encodeURIComponent(formatLocation());
      const url = Platform.select({
        ios: `maps:?q=${query}`,
        android: `geo:0,0?q=${query}`,
      });
      if (url) safeOpenURL(url, `https://www.google.com/maps/search/?api=1&query=${query}`);
      return;
    }

    const { lat, lng } = resolved.coords;
    const label = encodeURIComponent(title || formatLocation());
    const url = Platform.select({
      ios: `maps:?ll=${lat},${lng}&q=${label}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });

    if (url) {
      safeOpenURL(url, `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    }
  }, [resolved, location, title]);

  const openDirections = useCallback(() => {
    if (location?.link) {
      safeOpenURL(location.link);
      return;
    }

    if (!resolved?.coords || !resolved.isExact) {
      openInMaps();
      return;
    }

    const { lat, lng } = resolved.coords;
    const url = Platform.select({
      ios: `maps:?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });

    if (url) {
      safeOpenURL(url, `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
  }, [resolved, location, openInMaps]);

  if (!location) return null;

  const hasAnyLocationInfo = hasLink || resolved || location.city || location.area || location.province;
  if (!hasAnyLocationInfo) return null;

  return (
    <View style={styles.container}>
      {/* Map */}
      <TouchableOpacity
        style={styles.mapPreview}
        onPress={openInMaps}
        activeOpacity={0.9}
      >
        {resolved ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              mapStyle="https://tiles.openfreemap.org/styles/liberty"
              scrollEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              zoomEnabled={false}
              attributionEnabled={false}
              logoEnabled={false}
            >
              <Camera
                centerCoordinate={[resolved.coords.lng, resolved.coords.lat]}
                zoomLevel={resolved.zoom}
                animationMode="moveTo"
              />
              <PointAnnotation
                id="listing-location"
                coordinate={[resolved.coords.lng, resolved.coords.lat]}
              >
                <View style={styles.markerContainer}>
                  <MapPin size={28} color={theme.colors.primary} fill={theme.colors.primary} />
                </View>
              </PointAnnotation>
            </MapView>

            {/* Open in Maps button */}
            <View style={styles.openButton}>
              <ExternalLink size={16} color={theme.colors.primary} />
            </View>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MapPin size={32} color={theme.colors.textMuted} />
            <Text variant="small" color="muted" style={styles.tapText}>
              {hasLink ? 'اضغط لفتح الموقع' : 'اضغط للبحث عن الموقع'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Location Info */}
      <View style={styles.info}>
        <IconText
          icon={<MapPin size={18} color={theme.colors.primary} />}
          text={formatLocation()}
          variant="body"
          gap="sm"
          style={styles.locationRow}
        />

        {(hasLink || (resolved && resolved.isExact)) && (
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={openDirections}
          >
            <IconText
              icon={<Navigation size={16} color={theme.colors.textInverse} />}
              text="الاتجاهات"
              variant="small"
              textStyle={styles.directionsText}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    },
    mapPreview: {
      height: 200,
      backgroundColor: theme.colors.bg,
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    markerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    tapText: {
      textAlign: 'center',
    },
    openButton: {
      position: 'absolute',
      top: theme.spacing.sm,
      start: theme.spacing.sm,
      width: 32,
      height: 32,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    info: {
      padding: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    locationRow: {
      flex: 1,
    },
    directionsButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      borderRadius: theme.radius.full,
    },
    directionsText: {
      color: theme.colors.textInverse,
    },
  });

export default LocationMap;
