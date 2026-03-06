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
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag, Key } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text, Input, ChipSelector, ToggleField } from '../slices';
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
          {getValidationError('listingType') && (
            <Text variant="xs" color="error">{getValidationError('listingType')}</Text>
          )}
        </View>
      )}

      {/* Title */}
      <Input
        label="عنوان الإعلان"
        required
        value={formData.title}
        onChangeText={(text) => {
          setFormField('title', text);
          clearValidationError('title');
        }}
        placeholder="مثال: سيارة تويوتا كامري 2020"
        error={getValidationError('title')}
      />

      {/* Description */}
      <Input
        label="الوصف"
        value={formData.description}
        onChangeText={(text) => {
          setFormField('description', text);
          clearValidationError('description');
        }}
        placeholder="أضف وصفاً تفصيلياً للإعلان..."
        error={getValidationError('description')}
        multiline
        numberOfLines={4}
      />

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
        {getValidationError('priceMinor') && (
          <Text variant="xs" color="error">{getValidationError('priceMinor')}</Text>
        )}
      </View>

      {/* Condition */}
      <ChipSelector
        label="الحالة"
        options={CONDITIONS}
        value={formData.condition || ''}
        onChange={(value) => setFormField('condition', value as string)}
        containerStyle={styles.chipSelectorContainer}
      />

      {/* Bidding Toggle */}
      <ToggleField
        label="السماح بالمزايدة"
        description="يمكن للمشترين تقديم عروض أسعار"
        value={formData.allowBidding || false}
        onChange={(value) => setFormField('allowBidding', value)}
      />

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
          {getValidationError('biddingStartPrice') && (
            <Text variant="xs" color="error">{getValidationError('biddingStartPrice')}</Text>
          )}
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
    chipSelectorContainer: {
      marginBottom: 0,
    },
    listingTypeContainer: {
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
  });
