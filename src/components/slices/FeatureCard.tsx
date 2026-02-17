/**
 * FeatureCard Component
 * Feature/benefit card - matches web frontend FeatureCard
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../ui/Text';

export type FeatureCardVariant = 'default' | 'card' | 'icon-row' | 'minimal';
export type FeatureCardColor = 'bg' | 'surface' | 'primary' | 'accent';

export interface FeatureCardProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: FeatureCardVariant;
  color?: FeatureCardColor;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function FeatureCard({
  icon,
  title,
  description,
  variant = 'default',
  color,
  children,
  style,
}: FeatureCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'card':
        return {
          flexDirection: 'column',
          alignItems: 'center',
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.bg,
          borderRadius: theme.radius.lg,
        };
      case 'icon-row':
        return {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: theme.spacing.md,
        };
      case 'minimal':
        return {
          flexDirection: 'column',
          alignItems: 'center',
          padding: theme.spacing.md,
        };
      default:
        return {
          flexDirection: 'column',
          alignItems: 'center',
          padding: theme.spacing.lg,
        };
    }
  };

  // Icon container styles based on variant
  const getIconContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      justifyContent: 'center',
      alignItems: 'center',
    };

    switch (variant) {
      case 'card':
        return {
          ...baseStyles,
          width: theme.layout.avatarSizeLg,
          height: theme.layout.avatarSizeLg,
          backgroundColor: theme.colors.primaryLight,
          borderRadius: theme.radius.full,
        };
      case 'icon-row':
        return {
          ...baseStyles,
          width: theme.layout.avatarSizeMd,
          height: theme.layout.avatarSizeMd,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
        };
      case 'minimal':
        return {
          ...baseStyles,
          width: theme.layout.avatarSizeMd,
          height: theme.layout.avatarSizeMd,
          marginBottom: theme.spacing.xs,
        };
      default:
        return {
          ...baseStyles,
          width: theme.layout.avatarSizeMd + theme.spacing.sm,
          height: theme.layout.avatarSizeMd + theme.spacing.sm,
        };
    }
  };

  // Content styles based on variant
  const getContentStyles = (): ViewStyle => {
    const isRow = variant === 'icon-row';
    return {
      flex: isRow ? 1 : undefined,
      marginLeft: isRow ? theme.spacing.md : 0,
      alignItems: isRow ? 'flex-end' : 'center',
    };
  };

  // Color variant overrides for container background
  const getColorOverrides = (): { container: ViewStyle; iconBg: string } => {
    if (!color) {
      return { container: {}, iconBg: '' };
    }

    switch (color) {
      case 'primary':
        return {
          container: { backgroundColor: theme.colors.primary },
          iconBg: 'rgba(255, 255, 255, 0.15)',
        };
      case 'accent':
        return {
          container: { backgroundColor: theme.colors.accent },
          iconBg: 'rgba(255, 255, 255, 0.15)',
        };
      case 'surface':
        return {
          container: { backgroundColor: theme.colors.surface },
          iconBg: '',
        };
      case 'bg':
      default:
        return {
          container: { backgroundColor: theme.colors.bg },
          iconBg: '',
        };
    }
  };

  const colorOverrides = getColorOverrides();

  return (
    <View
      style={[
        styles.feature,
        getVariantStyles(),
        colorOverrides.container,
        style,
      ]}
    >
      {icon && (
        <View
          style={[
            getIconContainerStyles(),
            colorOverrides.iconBg ? { backgroundColor: colorOverrides.iconBg } : {},
          ]}
        >
          {icon}
        </View>
      )}
      <View style={[styles.content, getContentStyles()]}>
        {title && (
          <Text
            variant="h4"
            center={variant !== 'icon-row'}
            right={variant === 'icon-row'}
          >
            {title}
          </Text>
        )}
        {description && (
          <Text
            variant="small"
            center={variant !== 'icon-row'}
            right={variant === 'icon-row'}
            style={{ marginTop: theme.spacing.xs }}
          >
            {description}
          </Text>
        )}
        {children}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    feature: {
      gap: theme.spacing.sm,
    },
    content: {
      gap: theme.spacing.xs,
    },
  });

export default FeatureCard;
