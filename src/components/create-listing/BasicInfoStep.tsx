/**
 * Basic Info Step
 * Title, description, price, condition, bidding options
 * Also handles listing type (sale/rent) when category supports both
 * Includes real-time validation with Arabic error messages
 *
 * Price Input:
 * - User selects currency (USD, EUR, SYP)
 * - Enters price in selected currency
 * - Price is converted to USD before storing (backend stores all prices in USD)
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Switch } from 'react-native';
import { AlertCircle, ShoppingBag, Key } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { PriceInput } from '../slices/PriceInput';
import { useCreateListingStore } from '../../stores/createListingStore';
import { useCategoriesStore } from '../../stores/categoriesStore';
import { CONDITION_LABELS } from '../../constants/metadata-labels';

// Conditions from backend enum - using metadata-labels for Arabic text
const CONDITIONS = [
  { key: 'new', label: CONDITION_LABELS['new'] },
  { key: 'used_like_new', label: CONDITION_LABELS['used_like_new'] },
  { key: 'used', label: CONDITION_LABELS['used'] },
];

const LISTING_TYPES = [
  { key: 'sale', label: 'للبيع', icon: ShoppingBag },
  { key: 'rent', label: 'للإيجار', icon: Key },
];

export default function BasicInfoStep() {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const {
    formData,
    categoryId,
    setFormField,
    validationErrors,
    getValidationError,
    clearValidationError,
  } = useCreateListingStore();

  const { getCategoryById } = useCategoriesStore();

  // Get category to check supported listing types
  const category = categoryId ? getCategoryById(categoryId) : null;
  const supportedListingTypes = category?.supportedListingTypes || ['sale'];
  const showListingTypeSelector = supportedListingTypes.length > 1;

  const handlePriceChange = (usdValue: number) => {
    // PriceInput already converts to USD, store directly
    setFormField('priceMinor', usdValue);
    clearValidationError('priceMinor');
  };

  const handleBiddingPriceChange = (usdValue: number) => {
    // PriceInput already converts to USD, store directly
    setFormField('biddingStartPrice', usdValue);
    clearValidationError('biddingStartPrice');
  };

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
      {/* Listing Type - Only show if category supports multiple types */}
      {showListingTypeSelector && (
        <View style={styles.field}>
          <Text variant="body" style={styles.label}>نوع الإعلان *</Text>
          <View style={styles.listingTypeContainer}>
            {LISTING_TYPES.filter(type => supportedListingTypes.includes(type.key)).map((type) => {
              const IconComponent = type.icon;
              const isSelected = formData.listingType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.listingTypeCard,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.bg,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    setFormField('listingType', type.key);
                    clearValidationError('listingType');
                  }}
                >
                  <IconComponent size={24} color={isSelected ? theme.colors.textInverse : theme.colors.primary} />
                  <Text
                    variant="body"
                    style={{ color: isSelected ? theme.colors.textInverse : theme.colors.text }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderFieldError('listingType')}
        </View>
      )}

      {/* Title */}
      <View style={styles.field}>
        <Text variant="body" style={styles.label}>عنوان الإعلان *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bg,
              borderColor: getValidationError('title') ? theme.colors.error : theme.colors.border,
              color: theme.colors.text,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          value={formData.title}
          onChangeText={(text) => {
            setFormField('title', text);
            clearValidationError('title');
          }}
          placeholder="مثال: سيارة تويوتا كامري 2020"
          placeholderTextColor={theme.colors.textMuted}
        />
        {renderFieldError('title')}
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text variant="body" style={styles.label}>الوصف</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.colors.bg,
              borderColor: getValidationError('description') ? theme.colors.error : theme.colors.border,
              color: theme.colors.text,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          value={formData.description}
          onChangeText={(text) => {
            setFormField('description', text);
            clearValidationError('description');
          }}
          placeholder="أضف وصفاً تفصيلياً للإعلان..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {renderFieldError('description')}
      </View>

      {/* Price */}
      <View style={styles.field}>
        <PriceInput
          label="السعر *"
          value={formData.priceMinor}
          onChange={handlePriceChange}
          placeholder="أدخل السعر"
          error={!!getValidationError('priceMinor')}
          required
        />
        {renderFieldError('priceMinor')}
      </View>

      {/* Condition */}
      <View style={styles.field}>
        <Text variant="body" style={styles.label}>الحالة</Text>
        <View style={styles.conditionContainer}>
          {CONDITIONS.map((condition) => (
            <TouchableOpacity
              key={condition.key}
              style={[
                styles.conditionChip,
                {
                  backgroundColor:
                    formData.condition === condition.key
                      ? theme.colors.primary
                      : theme.colors.bg,
                  borderColor:
                    formData.condition === condition.key
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => setFormField('condition', condition.key)}
            >
              <Text
                variant="small"
                style={{
                  color:
                    formData.condition === condition.key
                      ? theme.colors.textInverse
                      : theme.colors.text,
                }}
              >
                {condition.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bidding Toggle */}
      <View style={[styles.field, styles.toggleField]}>
        <View style={styles.toggleInfo}>
          <Text variant="body">السماح بالمزايدة</Text>
          <Text variant="small" color="secondary">
            يمكن للمشترين تقديم عروض أسعار
          </Text>
        </View>
        <Switch
          value={formData.allowBidding}
          onValueChange={(value) => setFormField('allowBidding', value)}
          trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
          thumbColor={formData.allowBidding ? theme.colors.primary : theme.colors.surface}
        />
      </View>

      {/* Bidding Start Price */}
      {formData.allowBidding && (
        <View style={styles.field}>
          <PriceInput
            label="سعر البدء للمزايدة"
            value={formData.biddingStartPrice || 0}
            onChange={handleBiddingPriceChange}
            placeholder="أدخل سعر البدء"
            error={!!getValidationError('biddingStartPrice')}
          />
          {renderFieldError('biddingStartPrice')}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: theme.spacing.lg,
    },
    field: {
      gap: theme.spacing.sm,
    },
    label: {
      // Text component handles RTL automatically
    },
    input: {
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      fontSize: theme.fontSize.base,
    },
    textArea: {
      minHeight: 100,
      paddingTop: theme.spacing.md,
    },
    conditionContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      justifyContent: 'flex-start',
    },
    conditionChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
    },
    listingTypeContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.md,
    },
    listingTypeCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
    },
    toggleField: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    toggleInfo: {
      flex: 1,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
      gap: theme.spacing.xs,
    },
    // Error styles
    errorContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      justifyContent: 'flex-start',
    },
    errorText: {
      // Text component handles RTL automatically
    },
  });
