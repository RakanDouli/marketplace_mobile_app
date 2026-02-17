/**
 * Container Component
 * Base wrapper for sections - matches web frontend Container
 */

import React from 'react';
import { View, ViewStyle, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme';

export type PaddingSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type BackgroundType = 'transparent' | 'surface' | 'bg' | 'primary' | 'secondary';

export interface ContainerProps {
  children: React.ReactNode;
  paddingY?: PaddingSize;
  paddingX?: PaddingSize;
  background?: BackgroundType;
  outerBackground?: BackgroundType;
  style?: ViewStyle;
}

export function Container({
  children,
  paddingY = 'md',
  paddingX = 'md',
  background = 'transparent',
  outerBackground = 'transparent',
  style,
}: ContainerProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // Responsive horizontal padding for iPad/tablets
  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;

  const paddingMap: Record<PaddingSize, number> = {
    none: 0,
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
    xl: theme.spacing.xl,
    xxl: theme.spacing.xl * 1.5,
  };

  const backgroundMap: Record<BackgroundType, string> = {
    transparent: 'transparent',
    surface: theme.colors.surface,
    bg: theme.colors.bg,
    primary: theme.colors.primary,
    secondary: theme.colors.secondary || theme.colors.surface,
  };

  // Scale horizontal padding for larger screens
  const horizontalPadding = isLargeScreen
    ? paddingMap[paddingX] * 3
    : isTablet
      ? paddingMap[paddingX] * 2
      : paddingMap[paddingX];

  const innerContent = (
    <View
      style={[
        styles.container,
        {
          paddingVertical: paddingMap[paddingY],
          paddingHorizontal: horizontalPadding,
          backgroundColor: backgroundMap[background],
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  // If outerBackground is set, wrap in another View
  if (outerBackground !== 'transparent') {
    return (
      <View style={{ backgroundColor: backgroundMap[outerBackground], width: '100%' }}>
        {innerContent}
      </View>
    );
  }

  return innerContent;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default Container;
