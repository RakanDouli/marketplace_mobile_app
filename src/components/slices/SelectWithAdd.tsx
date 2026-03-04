/**
 * SelectWithAdd Component
 * Select dropdown with "Other" toggle for custom text entry
 * Used for Brand/Model/Variant selection where user can add custom value
 * Uses BaseModal for consistent styling
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Switch,
  Image,
} from 'react-native';
import { ChevronDown, Search, Check, Plus, Car } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';
import { Loading } from './Loading';
import { BaseModal } from './BaseModal';

export interface SelectWithAddOption {
  value: string;
  label: string;
  labelSecondary?: string; // For showing both Arabic and English
  logoUrl?: string;
  disabled?: boolean;
}

export interface SelectWithAddProps {
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled placeholder text */
  disabledPlaceholder?: string;
  /** Options list */
  options: SelectWithAddOption[];
  /** Selected value */
  value?: string;
  /** Change handler */
  onChange: (value: string, label?: string) => void;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Mark as required */
  required?: boolean;
  /** Enable search */
  searchable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  containerStyle?: object;
  /** Show logo/icon for options */
  showLogos?: boolean;
  /** Show "Other" toggle */
  showOtherToggle?: boolean;
  /** "Other" toggle label */
  otherToggleLabel?: string;
  /** Whether "Other" mode is active */
  isOther?: boolean;
  /** Handler for "Other" toggle */
  onOtherToggle?: (enabled: boolean) => void;
  /** Custom value when "Other" is active */
  customValue?: string;
  /** Handler for custom value change */
  onCustomChange?: (text: string) => void;
  /** Placeholder for custom input */
  customInputPlaceholder?: string;
}

export function SelectWithAdd({
  label,
  placeholder = 'اختر...',
  disabledPlaceholder,
  options,
  value,
  onChange,
  error,
  helpText,
  required = false,
  searchable = true,
  loading = false,
  disabled = false,
  containerStyle,
  showLogos = false,
  showOtherToggle = true,
  otherToggleLabel = 'أخرى',
  isOther = false,
  onOtherToggle,
  customValue = '',
  onCustomChange,
  customInputPlaceholder = 'أدخل القيمة',
}: SelectWithAddProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Get display text
  const getDisplayText = () => {
    if (disabled && disabledPlaceholder) return disabledPlaceholder;
    if (!value) return placeholder;
    if (typeof value === 'string' && value.startsWith('other:')) {
      return value.replace('other:', '');
    }
    if (selectedOption) {
      if (selectedOption.labelSecondary) {
        return `${selectedOption.label} - ${selectedOption.labelSecondary}`;
      }
      return selectedOption.label;
    }
    return placeholder;
  };

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query) ||
      (opt.labelSecondary && opt.labelSecondary.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  const handleSelect = useCallback((option: SelectWithAddOption) => {
    if (option.disabled) return;
    onChange(option.value, option.label);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleOtherToggle = (enabled: boolean) => {
    onOtherToggle?.(enabled);
    if (enabled) {
      onChange('', undefined);
    }
  };

  const handleCustomChange = (text: string) => {
    onCustomChange?.(text);
    onChange(`other:${text}`, text);
  };

  const renderOption = ({ item }: { item: SelectWithAddOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.optionSelected,
        item.disabled && styles.optionDisabled,
      ]}
      onPress={() => handleSelect(item)}
      disabled={item.disabled}
    >
      <View style={styles.optionContent}>
        {showLogos && (
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.surface }]}>
            {item.logoUrl ? (
              <Image
                source={{ uri: item.logoUrl }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <Car size={16} color={theme.colors.textMuted} />
            )}
          </View>
        )}
        <Text
          variant="body"
          style={[
            styles.optionText,
            item.value === value && { color: theme.colors.primary },
            item.disabled && { color: theme.colors.textMuted },
          ]}
        >
          {item.labelSecondary ? `${item.label} - ${item.labelSecondary}` : item.label}
        </Text>
      </View>
      {item.value === value && (
        <Check size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  // Render "Other" input mode
  if (isOther) {
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

        {/* Custom Input */}
        <View style={styles.customInputContainer}>
          <Plus size={20} color={theme.colors.primary} style={styles.customInputIcon} />
          <TextInput
            style={[
              styles.customInput,
              {
                borderColor: error ? theme.colors.error : theme.colors.primary,
                backgroundColor: theme.colors.bg,
                color: theme.colors.text,
              },
              disabled && styles.inputDisabled,
            ]}
            value={customValue}
            onChangeText={handleCustomChange}
            placeholder={disabled ? disabledPlaceholder : customInputPlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            textAlign={isRTL ? 'right' : 'left'}
            editable={!disabled}
          />
        </View>

        {/* "Other" toggle */}
        {showOtherToggle && (
          <View style={[styles.otherToggleRow, disabled && styles.toggleDisabled]}>
            <Text variant="small" color="secondary">{otherToggleLabel}</Text>
            <Switch
              value={isOther}
              onValueChange={handleOtherToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={isOther ? theme.colors.primary : theme.colors.surface}
              disabled={disabled}
            />
          </View>
        )}

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
      </View>
    );
  }

  // Render normal Select mode
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
          { borderColor: error ? theme.colors.error : theme.colors.border },
          disabled && styles.selectButtonDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text
          variant="body"
          style={[
            styles.selectText,
            !selectedOption && !value && { color: theme.colors.textMuted },
          ]}
        >
          {getDisplayText()}
        </Text>
        <ChevronDown size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>

      {/* "Other" toggle */}
      {showOtherToggle && (
        <View style={[styles.otherToggleRow, disabled && styles.toggleDisabled]}>
          <Text variant="small" color="secondary">{otherToggleLabel}</Text>
          <Switch
            value={isOther}
            onValueChange={handleOtherToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
            thumbColor={isOther ? theme.colors.primary : theme.colors.surface}
            disabled={disabled}
          />
        </View>
      )}

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
          <View style={styles.searchContainer}>
            <Search size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="بحث..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        )}

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="sm" />
          </View>
        ) : (
          /* Options List */
          <FlatList
            data={filteredOptions}
            keyExtractor={(item, index) => item.value || `option-${index}`}
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
        )}
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
      flexDirection: isRTL ? 'row-reverse' : 'row',
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontWeight: '500',
    },
    required: {
      color: theme.colors.error,
    },
    selectButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
      textAlign: isRTL ? 'right' : 'left',
    },
    helperText: {
      marginTop: theme.spacing.xs,
      textAlign: isRTL ? 'right' : 'left',
    },
    // "Other" toggle
    otherToggleRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    toggleDisabled: {
      opacity: 0.5,
    },
    // Custom input for "Other"
    customInputContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    customInputIcon: {
      position: 'absolute',
      [isRTL ? 'right' : 'left']: theme.spacing.md,
      zIndex: 1,
    },
    customInput: {
      flex: 1,
      borderWidth: 2,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      [isRTL ? 'paddingRight' : 'paddingLeft']: 44,
      minHeight: theme.layout.inputHeight,
      fontSize: theme.fontSize.base,
    },
    inputDisabled: {
      opacity: 0.5,
    },
    // Search
    searchContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
    // Loading
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    // Options list
    optionsList: {
      flexGrow: 0,
    },
    option: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
    optionContent: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      flex: 1,
    },
    optionText: {
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    // Logo
    logoContainer: {
      width: 32,
      height: 32,
      borderRadius: theme.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    logoImage: {
      width: 28,
      height: 28,
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
  });

export default SelectWithAdd;
