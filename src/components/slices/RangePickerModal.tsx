/**
 * RangePickerModal - Two-column range picker (min/max)
 * Used for price, year, mileage filters
 * Similar to Marktplaats/AutoScout24 UX
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

export interface RangeOption {
  key: string;
  value: string;
}

export interface RangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (min: string | undefined, max: string | undefined) => void;
  title: string;
  options: RangeOption[];
  minValue?: string;
  maxValue?: string;
  /** Format for display (e.g., "$" prefix for price) */
  formatValue?: (value: string) => string;
  /** Label for min column */
  minLabel?: string;
  /** Label for max column */
  maxLabel?: string;
}

export const RangePickerModal: React.FC<RangePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  options,
  minValue,
  maxValue,
  formatValue,
  minLabel = 'من',
  maxLabel = 'إلى',
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Local state for selection
  const [selectedMin, setSelectedMin] = useState<string | undefined>(minValue);
  const [selectedMax, setSelectedMax] = useState<string | undefined>(maxValue);

  // Refs for scroll views
  const minScrollRef = useRef<ScrollView>(null);
  const maxScrollRef = useRef<ScrollView>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedMin(minValue);
      setSelectedMax(maxValue);
    }
  }, [visible, minValue, maxValue]);

  // Scroll to selected values when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        if (selectedMin) {
          const minIndex = options.findIndex(o => o.key === selectedMin);
          if (minIndex >= 0 && minScrollRef.current) {
            minScrollRef.current.scrollTo({
              y: minIndex * ITEM_HEIGHT,
              animated: false,
            });
          }
        }
        if (selectedMax) {
          const maxIndex = options.findIndex(o => o.key === selectedMax);
          if (maxIndex >= 0 && maxScrollRef.current) {
            maxScrollRef.current.scrollTo({
              y: maxIndex * ITEM_HEIGHT,
              animated: false,
            });
          }
        }
      }, 100);
    }
  }, [visible, options]);

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(selectedMin, selectedMax);
    onClose();
  };

  // Handle clear/delete filter
  const handleClear = () => {
    setSelectedMin(undefined);
    setSelectedMax(undefined);
  };

  // Get display value
  const getDisplayValue = (value: string) => {
    if (formatValue) return formatValue(value);
    const option = options.find(o => o.key === value);
    return option?.value || value;
  };

  // Render option item
  const renderOptionItem = (
    option: RangeOption | null, // null = "All" option
    isSelected: boolean,
    onSelect: () => void,
    isMin: boolean
  ) => {
    const isAll = option === null;
    const displayText = isAll ? 'الكل' : (formatValue ? formatValue(option.key) : option.value);

    return (
      <TouchableOpacity
        key={isAll ? 'all' : option.key}
        style={[
          styles.optionItem,
          isSelected && styles.optionItemSelected,
        ]}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <Text
          variant="body"
          style={[
            styles.optionText,
            isSelected && styles.optionTextSelected,
          ]}
        >
          {displayText}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          {/* Header: Close left, Title center, Clear right */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text variant="h3" style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
              <Text variant="body" color="primary">مسح</Text>
            </TouchableOpacity>
          </View>

          {/* Column headers - RTL: من (from) on right, إلى (to) on left */}
          <View style={styles.columnHeaders}>
            <View style={styles.columnHeader}>
              <Text variant="body" color="secondary">{maxLabel}</Text>
            </View>
            <View style={styles.columnHeader}>
              <Text variant="body" color="secondary">{minLabel}</Text>
            </View>
          </View>

          {/* Two columns - RTL: من (min) on right, إلى (max) on left */}
          <View style={styles.columnsContainer}>
            {/* Max column (left side in RTL) */}
            <ScrollView
              ref={maxScrollRef}
              style={styles.column}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.columnContent}
            >
              {/* "All" option */}
              {renderOptionItem(
                null,
                selectedMax === undefined,
                () => setSelectedMax(undefined),
                false
              )}
              {/* Options */}
              {options.map((option) =>
                renderOptionItem(
                  option,
                  selectedMax === option.key,
                  () => setSelectedMax(option.key),
                  false
                )
              )}
            </ScrollView>

            {/* Divider */}
            <View style={styles.columnDivider} />

            {/* Min column (right side in RTL) */}
            <ScrollView
              ref={minScrollRef}
              style={styles.column}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.columnContent}
            >
              {/* "All" option */}
              {renderOptionItem(
                null,
                selectedMin === undefined,
                () => setSelectedMin(undefined),
                true
              )}
              {/* Options */}
              {options.map((option) =>
                renderOptionItem(
                  option,
                  selectedMin === option.key,
                  () => setSelectedMin(option.key),
                  true
                )
              )}
            </ScrollView>
          </View>

          {/* Selected values display */}
          <View style={styles.selectionDisplay}>
            <Text variant="body" color="secondary">
              {selectedMin && selectedMax
                ? `${getDisplayValue(selectedMin)} - ${getDisplayValue(selectedMax)}`
                : selectedMin
                  ? `من ${getDisplayValue(selectedMin)}`
                  : selectedMax
                    ? `إلى ${getDisplayValue(selectedMax)}`
                    : 'الكل'
              }
            </Text>
          </View>

          {/* Footer with OK button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text variant="body" style={styles.confirmButtonText}>
                تأكيد
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      maxHeight: SCREEN_HEIGHT * 0.7,
      paddingBottom: theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerButton: {
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    columnHeaders: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    columnHeader: {
      flex: 1,
      alignItems: 'center',
    },
    columnsContainer: {
      flexDirection: 'row',
      height: ITEM_HEIGHT * VISIBLE_ITEMS,
    },
    column: {
      flex: 1,
    },
    columnContent: {
      paddingVertical: theme.spacing.xs,
    },
    columnDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
    },
    optionItem: {
      height: ITEM_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    optionItemSelected: {
      backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}15`,
    },
    optionText: {
      textAlign: 'center',
    },
    optionTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    selectionDisplay: {
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footer: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.full,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#FFF',
      fontWeight: '600',
    },
  });

export default RangePickerModal;
