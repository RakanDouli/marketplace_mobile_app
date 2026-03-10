/**
 * Location & Review Step
 * Final step before submission - location selection and listing preview
 * Includes validation error display and preview modal
 */

import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MapPin, Navigation, Eye } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme, Theme } from '../../theme';
import { Text, Button, Select, Input } from '../slices';
import { useCreateListingStore } from '../../stores/createListingStore';
import { ListingPreviewModal } from './ListingPreviewModal';

// Syrian provinces - converted to Select option format
const PROVINCES = [
  { value: 'damascus', label: 'دمشق' },
  { value: 'rif_dimashq', label: 'ريف دمشق' },
  { value: 'aleppo', label: 'حلب' },
  { value: 'homs', label: 'حمص' },
  { value: 'hama', label: 'حماة' },
  { value: 'latakia', label: 'اللاذقية' },
  { value: 'tartus', label: 'طرطوس' },
  { value: 'deir_ezzor', label: 'دير الزور' },
  { value: 'idlib', label: 'إدلب' },
  { value: 'daraa', label: 'درعا' },
  { value: 'suwayda', label: 'السويداء' },
  { value: 'quneitra', label: 'القنيطرة' },
  { value: 'raqqa', label: 'الرقة' },
  { value: 'hasaka', label: 'الحسكة' },
];

export default function LocationReviewStep() {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);
  const {
    formData,
    setLocationField,
    getValidationError,
    clearValidationError,
  } = useCreateListingStore();

  // State
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const provinceError = getValidationError('location.province');

  // Get current location and generate Google Maps link
  const handleGetLocationLink = useCallback(async () => {
    setIsGettingLocation(true);

    try {
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          'خدمات الموقع',
          'يرجى تفعيل خدمات الموقع في إعدادات الجهاز',
          [{ text: 'حسناً' }]
        );
        setIsGettingLocation(false);
        return;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'صلاحية الموقع',
          'يرجى السماح بالوصول إلى الموقع للحصول على رابط الخريطة',
          [{ text: 'حسناً' }]
        );
        setIsGettingLocation(false);
        return;
      }


      // Get current location - use Balanced for faster response
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0,
      });


      const { latitude, longitude } = location.coords;

      // Validate coordinates
      if (!latitude || !longitude || latitude === 0 || longitude === 0) {
        Alert.alert(
          'خطأ',
          'لم يتم الحصول على إحداثيات صحيحة. حاول مرة أخرى.',
          [{ text: 'حسناً' }]
        );
        setIsGettingLocation(false);
        return;
      }

      // Generate Google Maps link
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

      // Set the link
      setLocationField('link', mapsLink);

      // Show success feedback
      Alert.alert(
        'تم',
        `تم الحصول على الموقع بنجاح\n${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        [{ text: 'حسناً' }]
      );

    } catch (error: any) {

      let errorMessage = 'فشل الحصول على الموقع.';

      // Handle specific error codes
      if (error?.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'الموقع غير متاح. تأكد من تفعيل GPS.';
      } else if (error?.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'انتهت مهلة الحصول على الموقع. حاول مرة أخرى.';
      } else if (error?.message) {
        errorMessage = `خطأ: ${error.message}`;
      }

      Alert.alert('خطأ', errorMessage, [{ text: 'حسناً' }]);
    } finally {
      setIsGettingLocation(false);
    }
  }, [setLocationField]);

  return (
    <View style={styles.container}>
      {/* Location Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={24} color={theme.colors.primary} />
          <Text variant="h3">الموقع</Text>
        </View>

        {/* Province Selection - Dropdown */}
        <Select
          label="المحافظة"
          placeholder="اختر المحافظة..."
          options={PROVINCES}
          value={formData.location.province}
          onChange={(value) => {
            setLocationField('province', value);
            clearValidationError('location.province');
          }}
          error={provinceError}
          required
          searchable
        />

        {/* City */}
        <Input
          label="المدينة"
          value={formData.location.city}
          onChangeText={(text) => setLocationField('city', text)}
          placeholder="أدخل اسم المدينة"
        />

        {/* Area */}
        <Input
          label="المنطقة / الحي"
          value={formData.location.area}
          onChangeText={(text) => setLocationField('area', text)}
          placeholder="أدخل اسم المنطقة أو الحي"
        />

        {/* Google Maps Link with Get Location Button */}
        <View style={styles.linkField}>
          <View style={styles.linkLabelRow}>
            <Button
              variant="outline"
              size="sm"
              icon={<Navigation size={16} color={theme.colors.primary} />}
              onPress={handleGetLocationLink}
              loading={isGettingLocation}
              disabled={isGettingLocation}
            >
              موقعي الحالي
            </Button>
            <Text variant="body">رابط خرائط Google</Text>
          </View>
          <Input
            value={formData.location.link}
            onChangeText={(text) => setLocationField('link', text)}
            placeholder="https://goo.gl/maps/..."
            autoCapitalize="none"
            keyboardType="url"
            containerStyle={styles.linkInput}
          />
        </View>
      </View>

      {/* Preview Button */}
      <View style={styles.section}>
        <Button
          variant="outline"
          size="lg"
          icon={<Eye size={20} color={theme.colors.primary} />}
          onPress={() => setShowPreviewModal(true)}
          style={styles.previewButton}
        >
          معاينة الإعلان
        </Button>
      </View>

      {/* Preview Modal */}
      <ListingPreviewModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: theme.spacing.lg,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    linkField: {
      gap: theme.spacing.sm,
    },
    linkLabelRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    linkInput: {
      marginBottom: 0,
    },
    previewButton: {
      marginTop: theme.spacing.md,
    },
  });
