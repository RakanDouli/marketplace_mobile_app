/**
 * RangePickerModal - Two-column range picker (min/max)
 * Uses native wheel picker for iOS, modal Select for Android
 * Used for price, year, mileage filters
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { X, Trash2 } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';
import { Select } from './Select';

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

  // Local state for selection (use empty string for "All")
  const [selectedMin, setSelectedMin] = useState<string>(minValue || '');
  const [selectedMax, setSelectedMax] = useState<string>(maxValue || '');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedMin(minValue || '');
      setSelectedMax(maxValue || '');
    }
  }, [visible, minValue, maxValue]);

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(
      selectedMin || undefined,
      selectedMax || undefined
    );
  };

  // Handle clear/delete filter
  const handleClear = () => {
    onConfirm(undefined, undefined);
  };

  // Get display value for selection summary
  const getDisplayValue = (value: string) => {
    if (!value) return 'الكل';
    if (formatValue) return formatValue(value);
    const option = options.find(o => o.key === value);
    return option?.value || value;
  };

  // Build picker items for iOS (native Picker)
  const pickerItems = useMemo(() => {
    const items = [{ key: '', value: 'الكل' }];
    options.forEach(opt => {
      items.push({
        key: opt.key,
        value: formatValue ? formatValue(opt.key) : opt.value,
      });
    });
    return items;
  }, [options, formatValue]);

  // Build select options for Android (Select component)
  const selectOptions = useMemo(() => {
    const items = [{ value: '', label: 'الكل' }];
    options.forEach(opt => {
      items.push({
        value: opt.key,
        label: formatValue ? formatValue(opt.key) : opt.value,
      });
    });
    return items;
  }, [options, formatValue]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => { }}>
          {/* Header: Close on left, Title center, Delete on right */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text variant="h3" style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
              <Trash2 size={20} color={theme.colors.error} />
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

          {/* Platform-specific pickers */}
          {Platform.OS === 'ios' ? (
            // iOS: Native wheel pickers side by side
            <View style={styles.pickersContainer}>
              {/* Max picker (left side in RTL) */}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedMax}
                  onValueChange={(value) => setSelectedMax(String(value))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {pickerItems.map((item) => (
                    <Picker.Item
                      key={`max-${item.key}`}
                      label={item.value}
                      value={item.key}
                      color={theme.colors.text}
                    />
                  ))}
                </Picker>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Min picker (right side in RTL) */}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedMin}
                  onValueChange={(value) => setSelectedMin(String(value))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {pickerItems.map((item) => (
                    <Picker.Item
                      key={`min-${item.key}`}
                      label={item.value}
                      value={item.key}
                      color={theme.colors.text}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          ) : (
            // Android: Use Select component (modal-based, no native dropdown issues)
            <View style={styles.androidSelectContainer}>
              <View style={styles.androidSelectRow}>
                {/* Max select (left side in RTL) */}
                <View style={styles.androidSelectWrapper}>
                  <Select
                    placeholder="الكل"
                    options={selectOptions}
                    value={selectedMax}
                    onChange={setSelectedMax}
                    searchable={false}
                    containerStyle={styles.androidSelect}
                  />
                </View>

                {/* Min select (right side in RTL) */}
                <View style={styles.androidSelectWrapper}>
                  <Select
                    placeholder="الكل"
                    options={selectOptions}
                    value={selectedMin}
                    onChange={setSelectedMin}
                    searchable={false}
                    containerStyle={styles.androidSelect}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Selected values display */}
          <View style={styles.selectionDisplay}>
            <Text variant="body" color="secondary">
              {selectedMin !== '' && selectedMax !== ''
                ? `${getDisplayValue(selectedMin)} - ${getDisplayValue(selectedMax)}`
                : selectedMin !== ''
                  ? `من ${getDisplayValue(selectedMin)}`
                  : selectedMax !== ''
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
      paddingBottom: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.full,
      padding: theme.spacing.sm,
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
    // iOS: Native wheel pickers
    pickersContainer: {
      flexDirection: 'row',
      height: 180,
    },
    pickerWrapper: {
      flex: 1,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    picker: {
      width: '100%',
      height: 180,
    },
    pickerItem: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.base,
      height: 180,
    },
    divider: {
      width: 1,
      backgroundColor: theme.colors.border,
    },
    // Android: Select component layout
    androidSelectContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
    androidSelectRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    androidSelectWrapper: {
      flex: 1,
    },
    androidSelect: {
      marginBottom: 0,
    },
    // Common
    selectionDisplay: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
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
