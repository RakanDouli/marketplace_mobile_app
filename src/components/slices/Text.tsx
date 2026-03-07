/**
 * Text Component
 * Typography component matching web frontend patterns
 */

import React from 'react';
import { Text as RNText, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'paragraph'
  | 'small'
  | 'xs'
  | 'navlink';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'muted'
  | 'inverse';

export interface TextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  bold?: boolean;
  center?: boolean;
  right?: boolean;
}

export function Text({
  variant = 'paragraph',
  color,
  children,
  style,
  numberOfLines,
  bold = false,
  center = false,
  right, // If not specified, uses theme direction
}: TextProps) {
  const theme = useTheme();

  // Determine text alignment based on RTL
  // If center is true, always center regardless of RTL
  // If right is explicitly set, use that value
  // Otherwise, align to start of reading direction
  const getTextAlign = (): TextStyle => {
    if (center) return { textAlign: 'center' };
    if (right !== undefined) {
      return right ? { textAlign: 'right' } : { textAlign: 'left' };
    }
    // Default: align to start of reading direction
    return { textAlign: theme.isRTL ? 'right' : 'left' };
  };

  const variantStyles: Record<TextVariant, TextStyle> = {
    h1: {
      fontSize: theme.fontSize['4xl'],
      fontWeight: theme.fontWeight.bold,
      fontFamily: theme.fontFamily.header,
      lineHeight: theme.fontSize['4xl'] * theme.lineHeight.tight,
    },
    h2: {
      fontSize: theme.fontSize['2xl'],
      fontWeight: theme.fontWeight.bold,
      fontFamily: theme.fontFamily.header,
      lineHeight: theme.fontSize['2xl'] * theme.lineHeight.tight,
    },
    h3: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.semibold,
      fontFamily: theme.fontFamily.headerMedium,
      lineHeight: theme.fontSize.xl * theme.lineHeight.tight,
    },
    h4: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold,
      fontFamily: theme.fontFamily.bodySemibold,
      lineHeight: theme.fontSize.base * theme.lineHeight.normal,
    },
    body: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.normal,
      fontFamily: theme.fontFamily.body,
      lineHeight: theme.fontSize.sm * theme.lineHeight.relaxed,
    },
    paragraph: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.normal,
      fontFamily: theme.fontFamily.body,
      lineHeight: theme.fontSize.sm * theme.lineHeight.relaxed,
    },
    small: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.normal,
      fontFamily: theme.fontFamily.body,
      lineHeight: theme.fontSize.sm * theme.lineHeight.relaxed,
    },
    xs: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.normal,
      fontFamily: theme.fontFamily.body,
      lineHeight: theme.fontSize.xs * theme.lineHeight.normal,
    },
    navlink: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.medium,
      fontFamily: theme.fontFamily.bodyMedium,
      lineHeight: theme.fontSize.xs * theme.lineHeight.normal,
    },
  };

  const colorStyles: Record<TextColor, string> = {
    primary: theme.colors.primary,
    secondary: theme.colors.textSecondary,
    error: theme.colors.error,
    success: theme.colors.success,
    warning: theme.colors.warning,
    info: theme.colors.info,
    muted: theme.colors.textMuted,
    inverse: theme.colors.textInverse,
  };

  return (
    <RNText
      style={[
        variantStyles[variant],
        { color: color ? colorStyles[color] : theme.colors.text },
        bold && { fontWeight: 'bold' },
        getTextAlign(),
        { writingDirection: theme.direction },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}

export default Text;
