/**
 * Input Component
 * Form input component matching web frontend patterns
 * Features: validation, Arabic numeral conversion, success/error states
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

// Convert Arabic numerals (٠١٢٣٤٥٦٧٨٩) to English (0123456789)
const convertArabicToEnglish = (str: string): string => {
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  return str.replace(/[٠-٩]/g, (d) => String(arabicNumerals.indexOf(d)));
};

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Error message (external or from validation) */
  error?: string;
  /** Help text shown below input */
  helpText?: string;
  /** Show success state (green border when valid) */
  success?: boolean;
  /** Mark field as required (shows asterisk) */
  required?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Container style override */
  containerStyle?: object;
  /** Input style override */
  inputStyle?: object;
  /** Validation function - return error message or undefined */
  validate?: (value: string) => string | undefined;
  /** Value to compare against (for password confirmation) */
  compareWith?: string;
  /** Show character counter when maxLength is set */
  showCounter?: boolean;
}

export function Input({
  label,
  error,
  helpText,
  success = false,
  required = false,
  leftIcon,
  rightIcon,
  secureTextEntry,
  containerStyle,
  inputStyle,
  validate,
  compareWith,
  maxLength,
  showCounter,
  value,
  onChangeText,
  ...props
}: InputProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

  const isPassword = secureTextEntry !== undefined;
  const showPassword = isPassword && isPasswordVisible;

  // Re-validate when compareWith changes (for password confirmation)
  useEffect(() => {
    if (compareWith !== undefined && validate && value) {
      const validationResult = validate(String(value));
      setValidationError(validationResult);
    }
  }, [compareWith, validate, value]);

  // Priority: external error > validation error
  const displayError = error || validationError;
  const hasAnyError = !!displayError;

  const getBorderColor = () => {
    if (hasAnyError) return theme.colors.error;
    if (success && !hasAnyError) return theme.colors.success;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  // Handle text change with Arabic numeral conversion and validation
  const handleChangeText = (text: string) => {
    // Convert Arabic numerals to English
    const convertedText = convertArabicToEnglish(text);

    // Run validation if provided
    if (validate) {
      const validationResult = validate(convertedText);
      setValidationError(validationResult);
    }

    // Call original onChangeText with converted value
    if (onChangeText) {
      onChangeText(convertedText);
    }
  };

  const charCount = String(value || '').length;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text variant="small" style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: theme.colors.bg,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              textAlign: 'right',
            },
            leftIcon ? styles.inputWithLeftIcon : undefined,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : undefined,
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          onChangeText={handleChangeText}
          maxLength={maxLength}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.colors.textMuted} />
            ) : (
              <Eye size={20} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {/* Error message */}
      {displayError && (
        <Text variant="xs" color="error" style={styles.helperText}>
          {displayError}
        </Text>
      )}

      {/* Help text (only show if no error) */}
      {helpText && !displayError && (
        <Text variant="xs" color="muted" style={styles.helperText}>
          {helpText}
        </Text>
      )}

      {/* Character counter */}
      {maxLength && showCounter !== false && (
        <Text variant="xs" color="muted" style={styles.counter}>
          {charCount} / {maxLength}
        </Text>
      )}
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
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: theme.radius.md,
      minHeight: theme.layout.inputHeight,
    },
    input: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      fontSize: theme.fontSize.base,
      writingDirection: 'rtl',
    },
    inputWithLeftIcon: {
      paddingStart: theme.spacing.sm,
    },
    inputWithRightIcon: {
      paddingEnd: theme.spacing.sm,
    },
    leftIcon: {
      paddingStart: theme.spacing.lg,
    },
    rightIcon: {
      paddingEnd: theme.spacing.lg,
    },
    helperText: {
      marginTop: theme.spacing.xs,
      textAlign: 'right',
    },
    counter: {
      marginTop: theme.spacing.xs,
      textAlign: 'left',
    },
  });

export default Input;
