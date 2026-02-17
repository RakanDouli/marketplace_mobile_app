/**
 * MultiSelect Component
 * Modal-based multi-select with search and checkboxes
 * Matches web frontend react-select multi functionality
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ChevronDown, Search, X, Check, Square, CheckSquare } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Options list */
  options: MultiSelectOption[];
  /** Selected values */
  value: string[];
  /** Change handler */
  onChange: (values: string[]) => void;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Show success state */
  success?: boolean;
  /** Mark as required */
  required?: boolean;
  /** Enable search */
  searchable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Maximum selections allowed */
  maxSelections?: number;
  /** Container style */
  containerStyle?: object;
}

export function MultiSelect({
  label,
  placeholder = 'اختر...',
  options,
  value = [],
  onChange,
  error,
  helpText,
  success = false,
  required = false,
  searchable = true,
  loading = false,
  disabled = false,
  maxSelections,
  containerStyle,
}: MultiSelectProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get selected options for display
  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Check if can select more
  const canSelectMore = !maxSelections || value.length < maxSelections;

  const handleToggle = useCallback((optionValue: string) => {
    const isSelected = value.includes(optionValue);

    if (isSelected) {
      // Remove from selection
      onChange(value.filter((v) => v !== optionValue));
    } else {
      // Add to selection (if allowed)
      if (canSelectMore) {
        onChange([...value, optionValue]);
      }
    }
  }, [value, onChange, canSelectMore]);

  const handleRemoveChip = useCallback((optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  }, [value, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (success) return theme.colors.success;
    return theme.colors.border;
  };

  const renderOption = ({ item }: { item: MultiSelectOption }) => {
    const isSelected = value.includes(item.value);
    const isDisabled = item.disabled || (!isSelected && !canSelectMore);

    return (
      <TouchableOpacity
        style={[
          styles.option,
          isSelected && styles.optionSelected,
          isDisabled && styles.optionDisabled,
        ]}
        onPress={() => !isDisabled && handleToggle(item.value)}
        disabled={isDisabled}
      >
        {isSelected ? (
          <CheckSquare size={22} color={theme.colors.primary} />
        ) : (
          <Square size={22} color={isDisabled ? theme.colors.textMuted : theme.colors.textSecondary} />
        )}
        <Text
          variant="body"
          style={[
            styles.optionText,
            isSelected && { color: theme.colors.primary },
            isDisabled && { color: theme.colors.textMuted },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text variant="small" style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          {maxSelections && (
            <Text variant="xs" color="muted">
              ({value.length}/{maxSelections})
            </Text>
          )}
        </View>
      )}

      {/* Select Button */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          { borderColor: getBorderColor() },
          disabled && styles.selectButtonDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        {selectedOptions.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScrollView}
            contentContainerStyle={styles.chipsContainer}
          >
            {selectedOptions.map((opt) => (
              <View key={opt.value} style={styles.chip}>
                <Text variant="small" style={styles.chipText}>
                  {opt.label}
                </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveChip(opt.value);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text variant="body" style={{ color: theme.colors.textMuted }}>
            {placeholder}
          </Text>
        )}
        <ChevronDown size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>

      {/* Error/Help text */}
      {error && (
        <Text variant="xs" color="error" style={styles.helperText}>
          {error}
        </Text>
      )}
      {helpText && !error && (
        <Text variant="xs" color="muted" style={styles.helperText}>
          {helpText}
        </Text>
      )}

      {/* Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />

          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
                disabled={value.length === 0}
              >
                <Text
                  variant="small"
                  style={{
                    color: value.length > 0 ? theme.colors.error : theme.colors.textMuted,
                  }}
                >
                  مسح الكل
                </Text>
              </TouchableOpacity>

              <Text variant="h4" style={styles.modalTitle}>
                {label || 'اختر'}
              </Text>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setIsOpen(false)}
              >
                <Text variant="small" style={{ color: theme.colors.primary }}>
                  تم
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selection count */}
            <View style={styles.selectionInfo}>
              <Text variant="small" color="secondary">
                {value.length} محدد
                {maxSelections && ` من ${maxSelections}`}
              </Text>
            </View>

            {/* Search Input */}
            {searchable && (
              <View style={styles.searchContainer}>
                <Search size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="بحث..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  textAlign="right"
                />
              </View>
            )}

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={renderOption}
              style={styles.optionsList}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text variant="body" color="muted">
                    لا توجد نتائج
                  </Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontWeight: '500',
    },
    required: {
      color: theme.colors.error,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: theme.layout.inputHeight,
      gap: theme.spacing.sm,
    },
    selectButtonDisabled: {
      opacity: 0.5,
    },
    chipsScrollView: {
      flex: 1,
    },
    chipsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      alignItems: 'center',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    chipText: {
      color: theme.colors.primary,
    },
    helperText: {
      marginTop: theme.spacing.xs,
      textAlign: 'right',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      maxHeight: '80%',
      paddingBottom: theme.spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      flex: 1,
      textAlign: 'center',
    },
    clearButton: {
      padding: theme.spacing.xs,
    },
    doneButton: {
      padding: theme.spacing.xs,
    },
    selectionInfo: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      gap: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      fontSize: theme.fontSize.base,
      color: theme.colors.text,
    },
    // Options list
    optionsList: {
      flexGrow: 0,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.md,
    },
    optionSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    optionDisabled: {
      opacity: 0.5,
    },
    optionText: {
      flex: 1,
      textAlign: 'right',
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
  });

export default MultiSelect;
