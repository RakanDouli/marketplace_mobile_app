/**
 * LocationMap Component
 * Displays a static map image with listing location
 * Uses OpenStreetMap static tiles (no API key needed)
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Navigation, ExternalLink } from 'lucide-react-native';
import { Text } from '../slices';
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

export function LocationMap({ location, title }: LocationMapProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // Format location string with Arabic translation
  // Priority: address (city/area) → province only
  const formatLocation = () => {
    if (!location) return 'موقع غير محدد';

    // If we have city or area, use full format
    if (location.city || location.area) {
      const formatted = formatLocationUtil({
        city: location.city || location.area,
        province: location.province,
      });
      return formatted || 'موقع غير محدد';
    }

    // If only province, translate it
    if (location.province) {
      const formatted = formatLocationUtil({
        province: location.province,
      });
      return formatted || location.province;
    }

    return 'موقع غير محدد';
  };

  // Check if we have a direct Google Maps link
  const hasLink = !!location?.link;

  // Check if we have coordinates
  const hasCoordinates = location?.coordinates?.lat && location?.coordinates?.lng;

  // Generate static map URL using OpenStreetMap tiles
  const getStaticMapUrl = () => {
    if (!hasCoordinates) return null;
    const { lat, lng } = location!.coordinates!;
    // Using OSM static maps - more reliable for Expo
    const zoom = 15;
    // Using openstreetmap.org static export (more reliable)
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  };

  // Alternative: Use tile-based static image URL
  const getStaticTileUrl = () => {
    if (!hasCoordinates) return null;
    const { lat, lng } = location!.coordinates!;
    const zoom = 15;
    // Calculate tile coordinates
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    // Return tile URL from OSM
    return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  };

  // Open in native maps app
  // Priority: link → coordinates → search by name
  const openInMaps = useCallback(() => {
    // Priority 1: If we have a direct link, open it
    if (location?.link) {
      Linking.openURL(location.link).catch(() => {
        // If link fails, try coordinates or search
        openWithCoordinatesOrSearch();
      });
      return;
    }

    // Priority 2 & 3: Use coordinates or search by name
    openWithCoordinatesOrSearch();
  }, [location, title]);

  // Helper to open maps with coordinates or search by name
  const openWithCoordinatesOrSearch = useCallback(() => {
    if (!location?.coordinates?.lat || !location?.coordinates?.lng) {
      // If no coordinates, try searching by name
      const query = encodeURIComponent(formatLocation());
      const url = Platform.select({
        ios: `maps:?q=${query}`,
        android: `geo:0,0?q=${query}`,
      });
      if (url) Linking.openURL(url);
      return;
    }

    const { lat, lng } = location.coordinates;
    const label = encodeURIComponent(title || formatLocation());

    const url = Platform.select({
      ios: `maps:?ll=${lat},${lng}&q=${label}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    }
  }, [location, title]);

  // Open directions
  const openDirections = useCallback(() => {
    // If we have a link, open it for directions (user can navigate from there)
    if (location?.link) {
      Linking.openURL(location.link);
      return;
    }

    if (!location?.coordinates?.lat || !location?.coordinates?.lng) {
      openInMaps();
      return;
    }

    const { lat, lng } = location.coordinates;
    const url = Platform.select({
      ios: `maps:?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      });
    }
  }, [location, openInMaps]);

  if (!location) {
    return null;
  }

  // Check if we have any location info to display
  const hasAnyLocationInfo = hasLink || hasCoordinates || location.city || location.area || location.province;

  if (!hasAnyLocationInfo) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Map Preview */}
      <TouchableOpacity
        style={styles.mapPreview}
        onPress={openInMaps}
        activeOpacity={0.9}
      >
        {hasCoordinates ? (
          <>
            <Image
              source={{ uri: getStaticTileUrl()! }}
              style={styles.map}
              contentFit="cover"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
            {/* Map Pin Marker Overlay */}
            <View style={styles.markerContainer}>
              <MapPin size={32} color={theme.colors.primary} fill={theme.colors.primary} />
            </View>
          </>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MapPin size={32} color={theme.colors.textMuted} />
            <Text variant="small" color="muted" style={styles.tapText}>
              {hasLink ? 'اضغط لفتح الموقع' : 'اضغط للبحث عن الموقع'}
            </Text>
          </View>
        )}

        {/* Open in Maps button */}
        <View style={styles.openButton}>
          <ExternalLink size={16} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Location Info */}
      <View style={styles.info}>
        <View style={styles.locationRow}>
          <MapPin size={18} color={theme.colors.primary} />
          <Text variant="body" style={styles.locationText}>
            {formatLocation()}
          </Text>
        </View>

        {/* Actions - show directions if we have link or coordinates */}
        {(hasLink || hasCoordinates) && (
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={openDirections}
          >
            <Navigation size={16} color="#FFFFFF" />
            <Text variant="small" style={styles.directionsText}>
              الاتجاهات
            </Text>
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

    // Map Preview
    mapPreview: {
      height: 180,
      backgroundColor: theme.colors.bg,
      position: 'relative',
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    markerContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -32,
      marginLeft: -16,
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
      left: theme.spacing.sm,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },

    // Info
    info: {
      padding: theme.spacing.md,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    locationRow: {
      flex: 1,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    locationText: {
      flex: 1,
      textAlign: 'right',
    },

    // Directions Button
    directionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      gap: theme.spacing.xs,
    },
    directionsText: {
      color: '#FFFFFF',
    },
  });

export default LocationMap;
