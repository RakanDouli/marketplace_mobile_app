/**
 * Basic Info Step
 * Title, description, price, condition, bidding options
 * Also handles listing type (sale/rent) when category supports both
 * Includes real-time validation with Arabic error messages
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Switch, I18nManager } from 'react-native';
import { AlertCircle, ShoppingBag, Key } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { useCreateListingStore } from '../../stores/createListingStore';
import { useCategoriesStore } from '../../stores/categoriesStore';

const CONDITIONS = [
  { key: 'new', label: 'جديد' },
  { key: 'like_new', label: 'كالجديد' },
  { key: 'excellent', label: 'ممتاز' },
  { key: 'good', label: 'جيد' },
  { key: 'fair', label: 'مقبول' },
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

  const handlePriceChange = (text: string) => {
    // Remove non-numeric characters except decimal
    const numericValue = text.replace(/[^0-9]/g, '');
    const priceMinor = parseInt(numericValue, 10) || 0;
    setFormField('priceMinor', priceMinor);
    clearValidationError('priceMinor');
  };

  const handleBiddingPriceChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    const price = parseInt(numericValue, 10) || 0;
    setFormField('biddingStartPrice', price);
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
                  <IconComponent size={24} color={isSelected ? '#fff' : theme.colors.primary} />
                  <Text
                    variant="body"
                    style={{ color: isSelected ? '#fff' : theme.colors.text }}
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
        <Text variant="body" style={styles.label}>السعر (ل.س) *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bg,
              borderColor: getValidationError('priceMinor') ? theme.colors.error : theme.colors.border,
              color: theme.colors.text,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          value={formData.priceMinor > 0 ? formData.priceMinor.toString() : ''}
          onChangeText={handlePriceChange}
          placeholder="أدخل السعر"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
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
                      ? '#fff'
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
          trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
          thumbColor={formData.allowBidding ? theme.colors.primary : '#f4f3f4'}
        />
      </View>

      {/* Bidding Start Price */}
      {formData.allowBidding && (
        <View style={styles.field}>
          <Text variant="body" style={styles.label}>سعر البدء للمزايدة (ل.س)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.bg,
                borderColor: getValidationError('biddingStartPrice') ? theme.colors.error : theme.colors.border,
                color: theme.colors.text,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            value={
              formData.biddingStartPrice !== undefined
                ? formData.biddingStartPrice.toString()
                : ''
            }
            onChangeText={handleBiddingPriceChange}
            placeholder="أدخل سعر البدء"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
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
      gap: 20,
    },
    field: {
      gap: 8,
    },
    label: {
      // Text component handles RTL automatically
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 14,
    },
    conditionContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'flex-start',
    },
    conditionChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
    },
    listingTypeContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
    },
    listingTypeCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    toggleField: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    toggleInfo: {
      flex: 1,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
      gap: 2,
    },
    // Error styles
    errorContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
      justifyContent: 'flex-start',
    },
    errorText: {
      // Text component handles RTL automatically
    },
  });
