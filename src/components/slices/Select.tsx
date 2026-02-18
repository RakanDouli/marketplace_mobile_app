/**
 * Select Component
 * Modal-based select with search and creatable support
 * Matches web frontend react-select functionality
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
} from 'react-native';
import { ChevronDown, Search, Plus, Check, X } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Options list */
  options: SelectOption[];
  /** Selected value */
  value?: string;
  /** Change handler */
  onChange: (value: string) => void;
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
  /** Enable creating new options */
  creatable?: boolean;
  /** Callback when creating new option */
  onCreateOption?: (value: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  containerStyle?: object;
}

export function Select({
  label,
  placeholder = 'اختر...',
  options,
  value,
  onChange,
  error,
  helpText,
  success = false,
  required = false,
  searchable = true,
  creatable = false,
  onCreateOption,
  loading = false,
  disabled = false,
  containerStyle,
}: SelectProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Check if search query matches any existing option
  const canCreateNew = useMemo(() => {
    if (!creatable || !searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return !options.some((opt) => opt.label.toLowerCase() === query);
  }, [creatable, options, searchQuery]);

  const handleSelect = useCallback((option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  const handleCreateNew = useCallback(() => {
    if (!searchQuery.trim() || !onCreateOption) return;
    onCreateOption(searchQuery.trim());
    setSearchQuery('');
    // Note: Parent should add the new option and set it as value
  }, [searchQuery, onCreateOption]);

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (success) return theme.colors.success;
    return theme.colors.border;
  };

  const renderOption = ({ item }: { item: SelectOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.optionSelected,
        item.disabled && styles.optionDisabled,
      ]}
      onPress={() => handleSelect(item)}
      disabled={item.disabled}
    >
      <Text
        variant="body"
        style={[
          styles.optionText,
          item.value === value && { color: theme.colors.primary },
          item.disabled && { color: theme.colors.textMuted },
        ]}
      >
        {item.label}
      </Text>
      {item.value === value && (
        <Check size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text variant="small" style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
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
        <Text
          variant="body"
          style={[
            styles.selectText,
            !selectedOption && { color: theme.colors.textMuted },
          ]}
        >
          {selectedOption?.label || placeholder}
        </Text>
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
              <Text variant="h4" style={styles.modalTitle}>
                {label || 'اختر'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
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

            {/* Create New Option */}
            {canCreateNew && (
              <TouchableOpacity
                style={styles.createOption}
                onPress={handleCreateNew}
              >
                <Plus size={20} color={theme.colors.primary} />
                <Text variant="body" style={{ color: theme.colors.primary }}>
                  إضافة "{searchQuery}"
                </Text>
              </TouchableOpacity>
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
      paddingHorizontal: theme.spacing.lg,
      minHeight: theme.layout.inputHeight,
    },
    selectButtonDisabled: {
      opacity: 0.5,
    },
    selectText: {
      flex: 1,
      textAlign: 'right',
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
    closeButton: {
      position: 'absolute',
      right: theme.spacing.lg,
      padding: theme.spacing.xs,
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
    // Create new option
    createOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    // Options list
    optionsList: {
      flexGrow: 0,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
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

export default Select;
