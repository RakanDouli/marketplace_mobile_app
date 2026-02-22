/**
 * Basic Info Step
 * Title, description, price, condition, bidding options
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../slices/Text';
import { useCreateListingStore } from '../../stores/createListingStore';

const CONDITIONS = [
  { key: 'new', label: 'جديد' },
  { key: 'like_new', label: 'كالجديد' },
  { key: 'excellent', label: 'ممتاز' },
  { key: 'good', label: 'جيد' },
  { key: 'fair', label: 'مقبول' },
];

export default function BasicInfoStep() {
  const theme = useTheme();
  const { formData, setFormField } = useCreateListingStore();

  const handlePriceChange = (text: string) => {
    // Remove non-numeric characters except decimal
    const numericValue = text.replace(/[^0-9]/g, '');
    const priceMinor = parseInt(numericValue, 10) || 0;
    setFormField('priceMinor', priceMinor);
  };

  const handleBiddingPriceChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    const price = parseInt(numericValue, 10) || 0;
    setFormField('biddingStartPrice', price);
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.field}>
        <Text variant="body" style={styles.label}>عنوان الإعلان *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={formData.title}
          onChangeText={(text) => setFormField('title', text)}
          placeholder="مثال: سيارة تويوتا كامري 2020"
          placeholderTextColor={theme.colors.textMuted}
          textAlign="right"
        />
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
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={formData.description}
          onChangeText={(text) => setFormField('description', text)}
          placeholder="أضف وصفاً تفصيلياً للإعلان..."
          placeholderTextColor={theme.colors.textMuted}
          textAlign="right"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Price */}
      <View style={styles.field}>
        <Text variant="body" style={styles.label}>السعر (ل.س) *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={formData.priceMinor > 0 ? formData.priceMinor.toString() : ''}
          onChangeText={handlePriceChange}
          placeholder="أدخل السعر"
          placeholderTextColor={theme.colors.textMuted}
          textAlign="right"
          keyboardType="numeric"
        />
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
                borderColor: theme.colors.border,
                color: theme.colors.text,
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
            textAlign="right"
            keyboardType="numeric"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    textAlign: 'right',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  conditionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
});
