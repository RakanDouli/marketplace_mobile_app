/**
 * Button Component
 * Matches web frontend Button.module.scss EXACTLY
 */

import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Icon to display. If provided, arrow prop is ignored. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
  /** Show arrow icon after text. Ignored if icon prop is provided. */
  arrow?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  arrow,
  onPress,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = loading || disabled;

  // Background color per variant
  const getBackgroundColor = (): string => {
    if (isDisabled) return theme.colors.border;

    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'success':
        return theme.colors.success;
      case 'danger':
        return theme.colors.error;
      case 'outline':
        return theme.colors.bg;
      case 'ghost':
      case 'link':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  // Text color per variant
  const getTextColor = (): string => {
    if (isDisabled) return theme.colors.textMuted;

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'success':
      case 'danger':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
      case 'link':
        return theme.colors.text;
      default:
        return '#FFFFFF';
    }
  };

  // Border per variant
  const getBorderStyle = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return { borderWidth: 1, borderColor: theme.colors.border };
      case 'primary':
      case 'secondary':
      case 'success':
      case 'danger':
        return { borderWidth: 1, borderColor: 'transparent' };
      default:
        return { borderWidth: 0, borderColor: 'transparent' };
    }
  };

  // Size styles using theme.spacing
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
        };
      case 'lg':
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        };
      default:
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
        };
    }
  };

  // Gap per size using theme.spacing
  const getGap = (): number => {
    switch (size) {
      case 'sm':
        return theme.spacing.xs;
      case 'lg':
        return theme.spacing.md;
      default:
        return theme.spacing.sm;
    }
  };

  // Font size per size
  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return theme.fontSize.sm;
      case 'lg':
        return theme.fontSize.lg;
      default:
        return theme.fontSize.base;
    }
  };

  // Letter spacing per size
  const getLetterSpacing = (): number => {
    return size === 'sm' ? 0.5 : 1;
  };

  // Icon size based on button size (matching web)
  const getIconSize = (): number => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 20;
      default:
        return 18;
    }
  };

  // Determine which icon to show (icon prop takes priority over arrow)
  const showIcon = icon || (arrow && !icon ? (
    <ArrowLeft size={getIconSize()} color={getTextColor()} />
  ) : null);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getSizeStyles(),
        getBorderStyle(),
        { backgroundColor: getBackgroundColor() },
        variant === 'link' && styles.linkButton,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={[styles.content, { gap: getGap() }]}>
          {/* Icon (always after text, matching web) */}
          {showIcon && <View style={styles.icon}>{showIcon}</View>}

          {/* Text content */}
          {children && (
            <Text
              variant="body"
              style={[
                styles.title,
                {
                  color: getTextColor(),
                  fontSize: getFontSize(),
                  letterSpacing: getLetterSpacing(),
                },
                variant === 'link' && styles.linkTitle,
                textStyle,
              ]}
              right={false}
            >
              {children}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    title: {
      textTransform: 'uppercase',
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
    },
    linkTitle: {
      textDecorationLine: 'underline',
      textTransform: 'none',
      fontWeight: theme.fontWeight.normal,
      letterSpacing: 0,
    },
    linkButton: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: 0,
      backgroundColor: 'transparent',
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    disabled: {
      opacity: 0.5,
    },
  });

export default Button;
