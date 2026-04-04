/**
 * LocationFilterModal
 * Full-screen modal for location filter with map + radius slider
 * Similar to Marktplaats location filter
 *
 * NOTE: Uses MapLibre (native module) - requires development build, not Expo Go
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapView, Camera } from '@maplibre/maplibre-react-native';
import { X, MapPin } from 'lucide-react-native';
import { Text, Select } from '../slices';
import { useTheme, Theme } from '../../theme';

/**
 * Syria province center coordinates
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

const PROVINCE_ARABIC: Record<string, string> = {
  damascus: 'دمشق',
  aleppo: 'حلب',
  homs: 'حمص',
  hama: 'حماة',
  latakia: 'اللاذقية',
  tartous: 'طرطوس',
  daraa: 'درعا',
  sweida: 'السويداء',
  quneitra: 'القنيطرة',
  idlib: 'إدلب',
  raqqa: 'الرقة',
  deir_ez_zor: 'دير الزور',
  hasakah: 'الحسكة',
  rif_damascus: 'ريف دمشق',
};

// Radius options for the select
const RADIUS_OPTIONS = [
  { value: '0', label: 'الكل' },
  { value: '5', label: '5 كم' },
  { value: '10', label: '10 كم' },
  { value: '25', label: '25 كم' },
  { value: '50', label: '50 كم' },
  { value: '100', label: '100 كم' },
  { value: '200', label: '200 كم' },
];

interface LocationFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (province: string | null, radiusKm: number | null, lat: number | null, lng: number | null) => void;
  initialProvince?: string | null;
  initialRadiusKm?: number | null;
}

export function LocationFilterModal({
  visible,
  onClose,
  onApply,
  initialProvince,
  initialRadiusKm,
}: LocationFilterModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.bottom);

  const [selectedProvince, setSelectedProvince] = useState<string | null>(initialProvince || null);
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm || 0); // 0 = everywhere

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedProvince(initialProvince || null);
      setRadiusKm(initialRadiusKm || 0);
    }
  }, [visible]);

  // Get coords for selected province
  const coords = useMemo(() => {
    if (!selectedProvince) return null;
    return SYRIA_PROVINCE_COORDS[selectedProvince.toLowerCase()] || null;
  }, [selectedProvince]);

  // Map zoom based on radius
  const mapZoom = useMemo(() => {
    if (!radiusKm || radiusKm === 0) return 7; // Show whole province
    if (radiusKm <= 5) return 13;
    if (radiusKm <= 10) return 12;
    if (radiusKm <= 25) return 10;
    if (radiusKm <= 50) return 9;
    if (radiusKm <= 100) return 8;
    return 7;
  }, [radiusKm]);

  // Default center (Syria)
  const defaultCenter = { lat: 34.8, lng: 38.0 };
  const center = coords || defaultCenter;

  // Province options for Select component
  const provinceOptions = useMemo(() =>
    Object.entries(PROVINCE_ARABIC).map(([key, label]) => ({
      value: key,
      label,
    })),
    []);

  const handleApply = useCallback(() => {
    if (!selectedProvince) {
      onApply(null, null, null, null);
    } else {
      const provinceCoords = SYRIA_PROVINCE_COORDS[selectedProvince.toLowerCase()];
      onApply(
        selectedProvince,
        radiusKm > 0 ? radiusKm : null,
        provinceCoords?.lat || null,
        provinceCoords?.lng || null,
      );
    }
    onClose();
  }, [selectedProvince, radiusKm, onApply, onClose]);

  const handleClear = useCallback(() => {
    setSelectedProvince(null);
    setRadiusKm(0);
  }, []);


  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h4" style={styles.headerTitle}>الموقع</Text>
          <View style={styles.closeButton} />
        </View>

        {/* Province Select */}
        <View style={styles.selectRow}>
          <Select
            label="المحافظة"
            placeholder="اختر المحافظة"
            options={provinceOptions}
            value={selectedProvince || ''}
            onChange={(value) => {
              setSelectedProvince(value || null);
              if (!value) setRadiusKm(0);
            }}
          />
        </View>

        {/* Map - always visible */}
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
              centerCoordinate={[center.lng, center.lat]}
              zoomLevel={coords ? mapZoom : 5}
              animationMode="easeTo"
              animationDuration={300}
            />
          </MapView>

          {/* Pin overlay (center of map) */}
          {coords && (
            <View style={styles.pinOverlay}>
              <MapPin size={32} color={theme.colors.primary} fill={theme.colors.primary} />
            </View>
          )}
        </View>

        {/* Distance Select */}
        <View style={styles.sliderSection}>
          <Select
            label="ابحث ضمن محيط"
            placeholder="اختر المسافة"
            options={RADIUS_OPTIONS}
            value={radiusKm.toString()}
            onChange={(value) => setRadiusKm(parseInt(value) || 0)}
            disabled={!selectedProvince}
          />
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text variant="body" color="muted">مسح فلتر الموقع</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text variant="body" style={styles.applyButtonText}>عرض النتائج</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, bottomInset: number = 0) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.bg,
      zIndex: 100,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      height: 44,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: theme.colors.text,
      textAlign: 'center',
    },

    // Province Select
    selectRow: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    provinceSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    provinceSelectorText: {
      flex: 1,
    },

    // Province List
    provinceList: {
      maxHeight: 300,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    provinceItem: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    provinceItemActive: {
      backgroundColor: theme.colors.primaryLight || theme.colors.primary + '15',
    },
    provinceItemTextActive: {
      color: theme.colors.primary,
      fontWeight: '600' as const,
    },

    // Map
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    pinOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -32,
      marginLeft: -16,
    },

    // Slider
    sliderSection: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },

    // Footer
    footer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md + bottomInset,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    clearButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    applyButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary,
    },
    applyButtonText: {
      color: theme.colors.textInverse,
      fontWeight: '600' as const,
    },
  });

export default LocationFilterModal;
