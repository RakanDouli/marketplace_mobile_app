/**
 * ChipSelector Component
 * Reusable chip-based selector for single or multi-select options
 * Supports RTL, theming, and validation errors
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export interface ChipOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

export interface ChipSelectorProps {
  /** Options to display as chips */
  options: ChipOption[];
  /** Current selected value(s) - string for single, string[] for multi */
  value: string | string[];
  /** Callback when selection changes */
  onChange: (value: string | string[]) => void;
  /** Label for the field */
  label?: string;
  /** Whether field is required (shows asterisk) */
  required?: boolean;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Error message to display */
  error?: string;
  /** Container style override */
  containerStyle?: object;
}

export function ChipSelector({
  options,
  value,
  onChange,
  label,
  required = false,
  multiple = false,
  error,
  containerStyle,
}: ChipSelectorProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

  const handlePress = (optionKey: string) => {
    if (multiple) {
      const isSelected = selectedValues.includes(optionKey);
      const newValues = isSelected
        ? selectedValues.filter((v) => v !== optionKey)
        : [...selectedValues, optionKey];
      onChange(newValues);
    } else {
      onChange(optionKey);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="body" style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={styles.chipsContainer}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.key);
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.bg,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={() => handlePress(option.key)}
            >
              {multiple && isSelected && (
                <Check size={14} color={theme.colors.textInverse} />
              )}
              {option.icon}
              <Text
                variant="small"
                style={{
                  color: isSelected
                    ? theme.colors.textInverse
                    : theme.colors.text,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && (
        <Text variant="xs" color="error" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      marginBottom: theme.spacing.sm,
    },
    required: {
      color: theme.colors.error,
    },
    chipsContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      justifyContent: 'flex-start',
    },
    chip: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
    },
    errorText: {
      marginTop: theme.spacing.xs,
    },
  });

export default ChipSelector;
