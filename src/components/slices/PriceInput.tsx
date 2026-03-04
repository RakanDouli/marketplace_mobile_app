/**
 * PriceInput - Reusable price input with currency selector
 *
 * Features:
 * - Currency selector (USD, EUR, SYP)
 * - Converts input to USD before calling onChange
 * - Shows conversion preview when not USD
 * - Number-only keyboard
 * - RTL support
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';
import { useCurrencyStore, Currency, CURRENCY_SYMBOLS } from '../../stores/currencyStore';

interface PriceInputProps {
  value: number; // USD value
  onChange: (usdValue: number) => void;
  placeholder?: string;
  /** Error message string or boolean */
  error?: string | boolean;
  label?: string;
  required?: boolean;
}

const CURRENCIES: Currency[] = ['SYP', 'EUR', 'USD'];

export function PriceInput({
  value,
  onChange,
  placeholder = 'أدخل السعر',
  error,
  label,
  required = false,
}: PriceInputProps) {
  const hasError = !!error;
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const { preferredCurrency, getRate } = useCurrencyStore();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(preferredCurrency);
  const [displayValue, setDisplayValue] = useState<string>('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Sync with preferred currency on mount
  useEffect(() => {
    setSelectedCurrency(preferredCurrency);
  }, [preferredCurrency]);

  // Convert USD to display currency when value changes externally
  useEffect(() => {
    if (value > 0) {
      if (selectedCurrency === 'USD') {
        setDisplayValue(Math.round(value).toLocaleString('en-US'));
      } else {
        const rate = getRate('USD', selectedCurrency);
        const converted = Math.round(value * rate);
        setDisplayValue(converted.toLocaleString('en-US'));
      }
    } else {
      setDisplayValue('');
    }
  }, [value, selectedCurrency, getRate]);

  const handlePriceChange = (text: string) => {
    // Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to Western (0123456789)
    // Also handle Persian/Urdu numerals (۰۱۲۳۴۵۶۷۸۹)
    const arabicIndicMap: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    };

    let withEnglishNumerals = '';
    for (const char of text) {
      withEnglishNumerals += arabicIndicMap[char] || char;
    }

    // Remove commas and non-numeric characters
    const cleanValue = withEnglishNumerals.replace(/[^0-9]/g, '');

    if (cleanValue) {
      const amount = parseInt(cleanValue, 10);
      // Format with commas for display
      setDisplayValue(amount.toLocaleString('en-US'));

      // Convert to USD
      let usdValue: number;
      if (selectedCurrency === 'USD') {
        usdValue = amount;
      } else {
        const rate = getRate(selectedCurrency, 'USD');
        usdValue = Math.round(amount * rate);
      }

      onChange(usdValue);
    } else {
      setDisplayValue('');
      onChange(0);
    }
  };

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency);
    setShowCurrencyPicker(false);

    // Recalculate display value for new currency
    if (value > 0) {
      if (currency === 'USD') {
        setDisplayValue(Math.round(value).toLocaleString('en-US'));
      } else {
        const rate = getRate('USD', currency);
        const converted = Math.round(value * rate);
        setDisplayValue(converted.toLocaleString('en-US'));
      }
    }
  };

  // Conversion preview (show USD equivalent when not USD)
  const conversionPreview =
    selectedCurrency !== 'USD' && value > 0
      ? `≈ ${CURRENCY_SYMBOLS.USD}${value.toLocaleString('en-US')} USD`
      : '';

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="body" style={styles.label}>
          {label} {required && '*'}
        </Text>
      )}

      <View style={styles.inputRow}>
        {/* Currency Selector */}
        <TouchableOpacity
          style={[
            styles.currencySelector,
            { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
          ]}
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
        >
          <Text variant="body">{CURRENCY_SYMBOLS[selectedCurrency]}</Text>
          <ChevronDown size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Price Input */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bg,
              borderColor: hasError ? theme.colors.error : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={displayValue}
          onChangeText={handlePriceChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="number-pad"
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>

      {/* Currency Dropdown */}
      {showCurrencyPicker && (
        <View
          style={[
            styles.currencyDropdown,
            { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
          ]}
        >
          {CURRENCIES.map((currency) => (
            <TouchableOpacity
              key={currency}
              style={[
                styles.currencyOption,
                selectedCurrency === currency && {
                  backgroundColor: theme.colors.primaryLight,
                },
              ]}
              onPress={() => handleCurrencySelect(currency)}
            >
              <Text
                variant="body"
                style={{
                  color:
                    selectedCurrency === currency
                      ? theme.colors.primary
                      : theme.colors.text,
                }}
              >
                {CURRENCY_SYMBOLS[currency]} {currency}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Conversion Preview */}
      {conversionPreview && (
        <Text variant="small" color="secondary" style={styles.preview}>
          {conversionPreview}
        </Text>
      )}

      {/* Error Message */}
      {typeof error === 'string' && error && (
        <Text variant="small" color="error" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
    },
    label: {},
    inputRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.sm,
    },
    currencySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      minWidth: 70,
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      fontSize: theme.fontSize.base,
    },
    currencyDropdown: {
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      marginTop: theme.spacing.xs,
      overflow: 'hidden',
    },
    currencyOption: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    preview: {
      marginTop: theme.spacing.xs,
    },
    errorText: {
      marginTop: theme.spacing.xs,
    },
  });

export default PriceInput;
