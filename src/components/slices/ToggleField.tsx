/**
 * ToggleField Component
 * Reusable toggle switch with label and optional description
 * Supports RTL and theming
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export interface ToggleFieldProps {
  /** Main label text */
  label: string;
  /** Optional description text below label */
  description?: string;
  /** Current toggle value */
  value: boolean;
  /** Callback when toggle changes */
  onChange: (value: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Container style override */
  containerStyle?: object;
}

export function ToggleField({
  label,
  description,
  value,
  onChange,
  disabled = false,
  containerStyle,
}: ToggleFieldProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }, containerStyle, disabled && styles.disabled]}>
      <View style={[styles.labelContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text variant="body">{label}</Text>
        {description && (
          <Text variant="small" color="secondary">
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
        ios_backgroundColor={theme.colors.border}
        disabled={disabled}
      />
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    labelContainer: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    disabled: {
      opacity: 0.5,
    },
  });

export default ToggleField;
