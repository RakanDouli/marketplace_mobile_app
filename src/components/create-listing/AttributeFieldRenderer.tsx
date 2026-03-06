/**
 * AttributeFieldRenderer
 * Dynamic component that maps attribute types to correct input components
 * Uses slice components: Input, Select, ChipSelector, ToggleField
 * Special cases (brandId, modelId, variantId, car_damage) are handled elsewhere
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text, Input, Select, ChipSelector } from '../slices';
import type { Attribute } from '../../stores/createListingStore/types';

// Convert Arabic numerals (٠١٢٣٤٥٦٧٨٩) to English (0123456789)
const convertArabicToEnglish = (str: string): string => {
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  return str.replace(/[٠-٩]/g, (d) => String(arabicNumerals.indexOf(d)));
};

export interface AttributeFieldRendererProps {
  /** The attribute definition from backend */
  attribute: Attribute;
  /** Current value */
  value: any;
  /** Change handler */
  onChange: (value: any) => void;
  /** Validation error message */
  error?: string;
  /** Clear validation error */
  onClearError?: () => void;
  /** Suggestion values from auto-fill */
  suggestions?: any[];
  /** Whether this field was auto-filled */
  wasAutoFilled?: boolean;
}

export function AttributeFieldRenderer({
  attribute,
  value,
  onChange,
  error,
  onClearError,
  suggestions,
  wasAutoFilled,
}: AttributeFieldRendererProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const isRequired = attribute.validation === 'REQUIRED' || attribute.validation === 'required';
  const attrType = attribute.type?.toLowerCase() || 'text';

  const handleChange = (newValue: any) => {
    onChange(newValue);
    onClearError?.();
  };

  // Convert attribute options to Select format
  const selectOptions = useMemo(() => {
    return (attribute.options || [])
      .filter(opt => opt.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(opt => ({
        value: opt.key,
        label: opt.value,
      }));
  }, [attribute.options]);

  // Convert attribute options to ChipSelector format
  const chipOptions = useMemo(() => {
    return (attribute.options || [])
      .filter(opt => opt.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(opt => ({
        key: opt.key,
        label: opt.value,
      }));
  }, [attribute.options]);

  // Render auto-fill badge
  const renderAutoFillBadge = () => {
    if (!wasAutoFilled) return null;
    return (
      <View style={[styles.autoFillBadge, { backgroundColor: theme.colors.successLight }]}>
        <Sparkles size={12} color={theme.colors.success} />
        <Text variant="xs" style={{ color: theme.colors.success }}>
          تم التعبئة تلقائياً
        </Text>
      </View>
    );
  };

  // Render suggestion chips (when multiple suggestions available)
  const renderSuggestionChips = () => {
    if (!suggestions || suggestions.length <= 1) return null;

    return (
      <View style={styles.suggestionContainer}>
        <View style={styles.suggestionHeader}>
          <Sparkles size={14} color={theme.colors.primary} />
          <Text variant="small" style={{ color: theme.colors.primary }}>
            اقتراحات تلقائية
          </Text>
        </View>
        <View style={styles.suggestionChipsContainer}>
          {suggestions.map((suggestion, index) => {
            const option = attribute.options?.find(opt => opt.key === String(suggestion));
            const displayValue = option?.value || String(suggestion);
            const isSelected = value === suggestion || value === String(suggestion);

            return (
              <TouchableOpacity
                key={`suggestion-${attribute.key}-${index}`}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.primaryLight,
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleChange(suggestion)}
              >
                <Text
                  variant="small"
                  style={{ color: isSelected ? theme.colors.textInverse : theme.colors.primary }}
                >
                  {displayValue}
                </Text>
                {isSelected && <Check size={12} color={theme.colors.textInverse} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render based on attribute type
  switch (attrType) {
    case 'select':
    case 'single_select':
    case 'selector': {
      return (
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text variant="body" style={styles.label}>
              {attribute.name} {isRequired && '*'}
            </Text>
            {renderAutoFillBadge()}
          </View>
          {renderSuggestionChips()}
          <Select
            options={selectOptions}
            value={value}
            onChange={handleChange}
            placeholder={`اختر ${attribute.name}`}
            error={error}
            searchable={selectOptions.length > 10}
            containerStyle={styles.selectContainer}
          />
        </View>
      );
    }

    case 'multi_select':
    case 'multi_selector': {
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <View style={styles.field}>
          <ChipSelector
            label={attribute.name}
            required={isRequired}
            options={chipOptions}
            value={selectedValues}
            onChange={handleChange}
            multiple
            error={error}
            containerStyle={styles.chipContainer}
          />
        </View>
      );
    }

    case 'number':
    case 'integer': {
      return (
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text variant="body" style={styles.label}>
              {attribute.name} {isRequired && '*'}
            </Text>
            {renderAutoFillBadge()}
          </View>
          {renderSuggestionChips()}
          <Input
            value={value?.toString() || ''}
            onChangeText={(text) => {
              const converted = convertArabicToEnglish(text);
              const numValue = parseInt(converted.replace(/[^0-9]/g, ''), 10) || 0;
              handleChange(numValue);
            }}
            placeholder={`أدخل ${attribute.name}`}
            keyboardType="number-pad"
            error={error}
            containerStyle={styles.inputContainer}
          />
        </View>
      );
    }

    case 'range_selector': {
      return (
        <View style={styles.field}>
          <Input
            label={attribute.name}
            required={isRequired}
            value={value?.toString() || ''}
            onChangeText={(text) => {
              const converted = convertArabicToEnglish(text);
              const numValue = parseInt(converted.replace(/[^0-9]/g, ''), 10) || 0;
              handleChange(numValue);
            }}
            placeholder={`أدخل ${attribute.name}`}
            keyboardType="number-pad"
            error={error}
            containerStyle={styles.inputContainer}
          />
        </View>
      );
    }

    case 'textarea': {
      return (
        <View style={styles.field}>
          <Input
            label={attribute.name}
            required={isRequired}
            value={value || ''}
            onChangeText={handleChange}
            placeholder={`أدخل ${attribute.name}`}
            multiline
            numberOfLines={4}
            error={error}
            containerStyle={styles.inputContainer}
          />
        </View>
      );
    }

    case 'boolean': {
      return (
        <View style={styles.field}>
          <ChipSelector
            label={attribute.name}
            required={isRequired}
            options={[
              { key: 'true', label: 'نعم' },
              { key: 'false', label: 'لا' },
            ]}
            value={value === true ? 'true' : value === false ? 'false' : ''}
            onChange={(val) => handleChange(val === 'true')}
            error={error}
            containerStyle={styles.chipContainer}
          />
        </View>
      );
    }

    case 'text':
    case 'string':
    default: {
      return (
        <View style={styles.field}>
          <Input
            label={attribute.name}
            required={isRequired}
            value={value || ''}
            onChangeText={handleChange}
            placeholder={`أدخل ${attribute.name}`}
            error={error}
            containerStyle={styles.inputContainer}
          />
        </View>
      );
    }
  }
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    field: {
      gap: theme.spacing.sm,
    },
    label: {},
    labelRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    inputContainer: {
      marginBottom: 0,
    },
    selectContainer: {
      marginBottom: 0,
    },
    chipContainer: {
      marginBottom: 0,
    },
    // Auto-fill badge
    autoFillBadge: {
      alignItems: 'center',
      gap: 4,
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.radius.full,
    },
    // Suggestion styles
    suggestionContainer: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    suggestionHeader: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    suggestionChipsContainer: {
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    suggestionChip: {
      alignItems: 'center',
      gap: 4,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
    },
  });

export default AttributeFieldRenderer;
