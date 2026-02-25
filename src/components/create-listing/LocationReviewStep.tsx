/**
 * Location & Review Step
 * Final step before submission - location selection and listing review
 * Includes validation error display
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MapPin, Check, AlertCircle } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { useCreateListingStore } from '../../stores/createListingStore';

// Syrian provinces
const PROVINCES = [
  { key: 'damascus', label: 'دمشق' },
  { key: 'rif_dimashq', label: 'ريف دمشق' },
  { key: 'aleppo', label: 'حلب' },
  { key: 'homs', label: 'حمص' },
  { key: 'hama', label: 'حماة' },
  { key: 'latakia', label: 'اللاذقية' },
  { key: 'tartus', label: 'طرطوس' },
  { key: 'deir_ezzor', label: 'دير الزور' },
  { key: 'idlib', label: 'إدلب' },
  { key: 'daraa', label: 'درعا' },
  { key: 'suwayda', label: 'السويداء' },
  { key: 'quneitra', label: 'القنيطرة' },
  { key: 'raqqa', label: 'الرقة' },
  { key: 'hasaka', label: 'الحسكة' },
];

export default function LocationReviewStep() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    formData,
    setLocationField,
    steps,
    validateStep,
    getValidationError,
    clearValidationError,
  } = useCreateListingStore();

  // Check validation for all steps
  const allStepsValid = steps.every((_, index) => validateStep(index));

  const provinceError = getValidationError('location.province');

  // Helper to render field error message
  const renderFieldError = (fieldKey: string) => {
    const error = getValidationError(fieldKey);
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={14} color={theme.colors.error} />
        <Text variant="small" style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Location Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={24} color={theme.colors.primary} />
          <Text variant="h3">الموقع</Text>
        </View>

        {/* Province Selection */}
        <View style={styles.field}>
          <Text variant="body" style={styles.label}>المحافظة *</Text>
          <View style={styles.provincesGrid}>
            {PROVINCES.map((province) => (
              <TouchableOpacity
                key={province.key}
                style={[
                  styles.provinceChip,
                  {
                    backgroundColor:
                      formData.location.province === province.key
                        ? theme.colors.primary
                        : theme.colors.bg,
                    borderColor:
                      formData.location.province === province.key
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setLocationField('province', province.key);
                  clearValidationError('location.province');
                }}
              >
                <Text
                  variant="small"
                  style={{
                    color:
                      formData.location.province === province.key
                        ? theme.colors.textInverse
                        : theme.colors.text,
                  }}
                >
                  {province.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {renderFieldError('location.province')}
        </View>

        {/* City */}
        <View style={styles.field}>
          <Text variant="body" style={styles.label}>المدينة</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={formData.location.city}
            onChangeText={(text) => setLocationField('city', text)}
            placeholder="أدخل اسم المدينة"
            placeholderTextColor={theme.colors.textMuted}
            textAlign="right"
          />
        </View>

        {/* Area */}
        <View style={styles.field}>
          <Text variant="body" style={styles.label}>المنطقة / الحي</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={formData.location.area}
            onChangeText={(text) => setLocationField('area', text)}
            placeholder="أدخل اسم المنطقة أو الحي"
            placeholderTextColor={theme.colors.textMuted}
            textAlign="right"
          />
        </View>

        {/* Google Maps Link */}
        <View style={styles.field}>
          <Text variant="body" style={styles.label}>رابط خرائط Google (اختياري)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={formData.location.link}
            onChangeText={(text) => setLocationField('link', text)}
            placeholder="https://goo.gl/maps/..."
            placeholderTextColor={theme.colors.textMuted}
            textAlign="left"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      </View>

      {/* Review Summary */}
      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>مراجعة الإعلان</Text>

        {/* Summary Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text variant="body">{formData.title || 'بدون عنوان'}</Text>
            <Text variant="small" color="secondary">العنوان</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text variant="body">
              {formData.priceMinor > 0
                ? `${formData.priceMinor.toLocaleString()} ل.س`
                : 'غير محدد'}
            </Text>
            <Text variant="small" color="secondary">السعر</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text variant="body">{formData.images.length} صور</Text>
            <Text variant="small" color="secondary">الصور</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text variant="body">
              {PROVINCES.find((p) => p.key === formData.location.province)?.label ||
                'غير محدد'}
            </Text>
            <Text variant="small" color="secondary">الموقع</Text>
          </View>
        </View>

        {/* Validation Status */}
        <View
          style={[
            styles.validationCard,
            {
              backgroundColor: allStepsValid
                ? theme.colors.successLight
                : theme.colors.warningLight,
            },
          ]}
        >
          {allStepsValid ? (
            <>
              <Check size={20} color={theme.colors.success} />
              <Text variant="body" style={{ color: theme.colors.success }}>
                جميع الحقول المطلوبة مكتملة
              </Text>
            </>
          ) : (
            <>
              <AlertCircle size={20} color={theme.colors.warning} />
              <Text variant="body" style={{ color: theme.colors.warning }}>
                يرجى استكمال جميع الحقول المطلوبة
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: theme.spacing.lg,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      textAlign: 'right',
    },
    field: {
      gap: theme.spacing.sm,
    },
    label: {
      textAlign: 'right',
    },
    input: {
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      fontSize: theme.fontSize.base,
    },
    provincesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      justifyContent: 'flex-end',
    },
    provinceChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
    },
    summaryCard: {
      borderWidth: 1,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    validationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },
    // Error styles
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      justifyContent: 'flex-end',
    },
    errorText: {
      textAlign: 'right',
    },
  });
