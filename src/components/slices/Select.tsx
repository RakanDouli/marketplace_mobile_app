/**
 * Select Component
 * Modal-based select with search and creatable support
 * Matches web frontend react-select functionality
 * Uses BaseModal for consistent styling
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { ChevronDown, Search, Plus, Check } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';
import { BaseModal } from './BaseModal';

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
  const styles = useMemo(() => createStyles(theme, theme.isRTL), [theme]);

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
  }, [searchQuery, onCreateOption]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (success) return theme.colors.success;
    return theme.colors.border;
  };

  const renderOption = (item: SelectOption) => (
    <TouchableOpacity
      key={item.value}
      style={[
        styles.option,
        theme.rtl.flexDirection.row(),
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
          theme.rtl.flexDirection.row(),
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

      {/* Modal using BaseModal */}
      <BaseModal
        visible={isOpen}
        onClose={handleClose}
        title={label || 'اختر'}
        bodyPadding="none"
      >
        {/* Search Input */}
        {searchable && (
          <View style={[styles.searchContainer, theme.rtl.flexDirection.row()]}>
            <Search size={20} color={theme.colors.textMuted} />
            <TextInput
              style={[styles.searchInput, theme.rtl.textAlign.start()]}
              placeholder="بحث..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>
        )}

        {/* Create New Option */}
        {canCreateNew && (
          <TouchableOpacity
            style={[styles.createOption, theme.rtl.flexDirection.row()]}
            onPress={handleCreateNew}
          >
            <Plus size={20} color={theme.colors.primary} />
            <Text variant="body" style={{ color: theme.colors.primary }}>
              إضافة "{searchQuery}"
            </Text>
          </TouchableOpacity>
        )}

        {/* Options List */}
        <ScrollView
          style={styles.optionsList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map(renderOption)
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="muted">
                لا توجد نتائج
              </Text>
            </View>
          )}
        </ScrollView>
      </BaseModal>
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    labelContainer: {
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontWeight: '500',
    },
    required: {
      color: theme.colors.error,
    },
    selectButton: {
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bg,
      paddingStart: theme.spacing.lg,
      paddingEnd: theme.spacing.lg,
      minHeight: theme.layout.inputHeight,
    },
    selectButtonDisabled: {
      opacity: 0.5,
    },
    selectText: {
      flex: 1,
    },
    helperText: {
      marginTop: theme.spacing.xs,
    },
    // Search
    searchContainer: {
      alignItems: 'center',
      marginStart: theme.spacing.lg,
      marginEnd: theme.spacing.lg,
      marginVertical: theme.spacing.md,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
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
      alignItems: 'center',
      paddingStart: theme.spacing.lg,
      paddingEnd: theme.spacing.lg,
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingStart: theme.spacing.lg,
      paddingEnd: theme.spacing.lg,
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
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
  });

export default Select;
