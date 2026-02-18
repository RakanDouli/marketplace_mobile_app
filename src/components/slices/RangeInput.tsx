/**
 * RangeInput Component
 * Two-input range selector for min/max values (price, year, mileage)
 * Supports both free-text input and dropdown selection from options
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';

// Convert Arabic numerals (٠١٢٣٤٥٦٧٨٩) to English (0123456789)
const convertArabicToEnglish = (str: string): string => {
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  return str.replace(/[٠-٩]/g, (d) => String(arabicNumerals.indexOf(d)));
};

export interface RangeOption {
  key: string;
  value: string;
  count?: number;
}

export interface RangeInputProps {
  /** Label for the range input */
  label: string;
  /** Placeholder for min input */
  minPlaceholder?: string;
  /** Placeholder for max input */
  maxPlaceholder?: string;
  /** Current min value */
  minValue: string;
  /** Current max value */
  maxValue: string;
  /** Callback when min changes */
  onMinChange: (value: string) => void;
  /** Callback when max changes */
  onMaxChange: (value: string) => void;
  /** Options for dropdown selection (for year, mileage) */
  options?: RangeOption[];
  /** Keyboard type for inputs */
  keyboardType?: 'numeric' | 'number-pad' | 'decimal-pad';
  /** Unit label (e.g., "$", "km") */
  unit?: string;
  /** Show unit on left side */
  unitPosition?: 'left' | 'right';
}

export function RangeInput({
  label,
  minPlaceholder = 'من',
  maxPlaceholder = 'إلى',
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  options,
  keyboardType = 'numeric',
  unit,
  unitPosition = 'right',
}: RangeInputProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showMinPicker, setShowMinPicker] = useState(false);
  const [showMaxPicker, setShowMaxPicker] = useState(false);

  // Check if we should use dropdown mode (has options)
  const useDropdown = options && options.length > 0;

  // Get display value for dropdown
  const getDisplayValue = (value: string) => {
    if (!value) return '';
    const option = options?.find(o => o.key === value);
    return option?.value || value;
  };

  // Filter options for max based on min selection
  const getMaxOptions = () => {
    if (!options) return [];
    if (!minValue) return options;
    const minIndex = options.findIndex(o => o.key === minValue);
    if (minIndex === -1) return options;
    return options.slice(minIndex);
  };

  // Filter options for min based on max selection
  const getMinOptions = () => {
    if (!options) return [];
    if (!maxValue) return options;
    const maxIndex = options.findIndex(o => o.key === maxValue);
    if (maxIndex === -1) return options;
    return options.slice(0, maxIndex + 1);
  };

  // Handle text input change
  const handleTextChange = (text: string, isMin: boolean) => {
    const converted = convertArabicToEnglish(text);
    // Only allow numbers
    const numericOnly = converted.replace(/[^0-9]/g, '');
    if (isMin) {
      onMinChange(numericOnly);
    } else {
      onMaxChange(numericOnly);
    }
  };

  // Render option picker modal
  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    options: RangeOption[],
    selectedValue: string,
    onSelect: (value: string) => void,
    title: string
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="h4">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  selectedValue === item.key && styles.optionItemSelected,
                ]}
                onPress={() => {
                  onSelect(item.key);
                  onClose();
                }}
              >
                <Text
                  variant="body"
                  color={selectedValue === item.key ? 'primary' : 'secondary'}
                >
                  {item.value}
                </Text>
                {item.count !== undefined && item.count > 0 && (
                  <Text variant="small" color="muted">
                    ({item.count})
                  </Text>
                )}
              </TouchableOpacity>
            )}
            style={styles.optionsList}
          />

          {selectedValue && (
            <Button
              variant="link"
              onPress={() => {
                onSelect('');
                onClose();
              }}
              style={styles.clearButton}
            >
              مسح الاختيار
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text variant="small" style={styles.label}>{label}</Text>

      <View style={styles.inputsRow}>
        {/* Min Input */}
        {useDropdown ? (
          <TouchableOpacity
            style={styles.dropdownInput}
            onPress={() => setShowMinPicker(true)}
          >
            <Text
              variant="body"
              color={minValue ? 'secondary' : 'muted'}
              style={styles.dropdownText}
            >
              {minValue ? getDisplayValue(minValue) : minPlaceholder}
            </Text>
            <ChevronDown size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.textInputContainer}>
            {unit && unitPosition === 'left' && (
              <Text variant="body" color="muted" style={styles.unitLeft}>{unit}</Text>
            )}
            <TextInput
              style={styles.textInput}
              placeholder={minPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={minValue}
              onChangeText={(text) => handleTextChange(text, true)}
              keyboardType={keyboardType}
              textAlign="right"
            />
            {unit && unitPosition === 'right' && (
              <Text variant="body" color="muted" style={styles.unitRight}>{unit}</Text>
            )}
          </View>
        )}

        {/* Separator */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
        </View>

        {/* Max Input */}
        {useDropdown ? (
          <TouchableOpacity
            style={styles.dropdownInput}
            onPress={() => setShowMaxPicker(true)}
          >
            <Text
              variant="body"
              color={maxValue ? 'secondary' : 'muted'}
              style={styles.dropdownText}
            >
              {maxValue ? getDisplayValue(maxValue) : maxPlaceholder}
            </Text>
            <ChevronDown size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.textInputContainer}>
            {unit && unitPosition === 'left' && (
              <Text variant="body" color="muted" style={styles.unitLeft}>{unit}</Text>
            )}
            <TextInput
              style={styles.textInput}
              placeholder={maxPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={maxValue}
              onChangeText={(text) => handleTextChange(text, false)}
              keyboardType={keyboardType}
              textAlign="right"
            />
            {unit && unitPosition === 'right' && (
              <Text variant="body" color="muted" style={styles.unitRight}>{unit}</Text>
            )}
          </View>
        )}
      </View>

      {/* Min Picker Modal */}
      {useDropdown && renderPickerModal(
        showMinPicker,
        () => setShowMinPicker(false),
        getMinOptions(),
        minValue,
        onMinChange,
        `${label} - ${minPlaceholder}`
      )}

      {/* Max Picker Modal */}
      {useDropdown && renderPickerModal(
        showMaxPicker,
        () => setShowMaxPicker(false),
        getMaxOptions(),
        maxValue,
        onMaxChange,
        `${label} - ${maxPlaceholder}`
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontWeight: '500',
      marginBottom: theme.spacing.sm,
      textAlign: 'right',
    },
    inputsRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    dropdownInput: {
      flex: 1,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.bg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      minHeight: 48,
    },
    dropdownText: {
      flex: 1,
      textAlign: 'right',
    },
    textInputContainer: {
      flex: 1,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.bg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
    },
    textInput: {
      flex: 1,
      fontSize: theme.fontSize.base,
      color: theme.colors.text,
      paddingVertical: theme.spacing.sm,
      writingDirection: 'rtl',
    },
    unitLeft: {
      marginStart: theme.spacing.xs,
    },
    unitRight: {
      marginEnd: theme.spacing.xs,
    },
    separator: {
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    separatorLine: {
      width: 12,
      height: 2,
      backgroundColor: theme.colors.border,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      maxHeight: '70%',
      paddingBottom: theme.spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionsList: {
      paddingHorizontal: theme.spacing.lg,
    },
    optionItem: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionItemSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    clearButton: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
  });

export default RangeInput;
