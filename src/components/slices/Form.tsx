/**
 * Form Component
 * Form wrapper with error/success messages
 * Matches web frontend Form.tsx patterns
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export interface FormProps {
  /** Form-level error message (e.g., from API) */
  error?: string;
  /** Success message */
  success?: string;
  /** Form children (Input components, buttons, etc.) */
  children: React.ReactNode;
  /** Container style */
  style?: object;
}

export function Form({
  error,
  success,
  children,
  style,
}: FormProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.form, style]}>
      {/* Form fields */}
      {children}

      {/* Form-level error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text variant="small" style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}

      {/* Form-level success */}
      {success && (
        <View style={styles.successContainer}>
          <Text variant="small" style={styles.successText}>
            ✓ {success}
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    form: {
      width: '100%',
    },
    errorContainer: {
      backgroundColor: theme.colors.errorLight,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      marginTop: theme.spacing.md,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
    },
    successContainer: {
      backgroundColor: theme.colors.successLight,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      marginTop: theme.spacing.md,
    },
    successText: {
      color: theme.colors.success,
      textAlign: 'center',
    },
  });

export default Form;
