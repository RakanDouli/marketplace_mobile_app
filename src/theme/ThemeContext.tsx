/**
 * Theme Context Provider for Shambay Mobile App
 * Provides theme values (colors, spacing, typography) to all components
 * Includes RTL/LTR direction support for internationalization
 */

import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import colors, { ThemeColors } from './colors';
import { spacing, radius, layout, iconSize, shadows } from './spacing';
import { fontFamily, fontSize, fontWeight, lineHeight, textStyles } from './typography';
import { useLanguageStore, type Direction } from '../stores/languageStore';

// Theme mode type
type ThemeMode = 'light' | 'dark' | 'system';

// Full theme object type
export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  iconSize: typeof iconSize;
  shadows: typeof shadows;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
  textStyles: typeof textStyles;
  isDark: boolean;
  // i18n support
  direction: Direction;
  isRTL: boolean;
}

// Context value type
interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

/**
 * Theme Provider Component
 * Wraps the app and provides theme values to all child components
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light', // Default to light for now
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultMode);

  // Get direction from language store (zustand store always returns a value)
  const direction = useLanguageStore((state) => state.direction) || 'rtl';

  // Determine actual theme based on mode
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  // Memoize theme object to prevent cascade re-renders
  // Only recreates when isDark or direction changes
  const theme = useMemo<Theme>(() => ({
    colors: isDark ? colors.dark : colors.light,
    spacing,
    radius,
    layout,
    iconSize,
    shadows,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    textStyles,
    isDark,
    // i18n support
    direction,
    isRTL: direction === 'rtl',
  }), [isDark, direction]);

  // Memoize setThemeMode callback
  const handleSetThemeMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    themeMode,
    setThemeMode: handleSetThemeMode,
  }), [theme, themeMode, handleSetThemeMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Default theme for fallback (prevents crashes during initialization)
const defaultTheme: Theme = {
  colors: colors.light,
  spacing,
  radius,
  layout,
  iconSize,
  shadows,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyles,
  isDark: false,
  direction: 'rtl',
  isRTL: true,
};

/**
 * Hook to access theme values
 * Must be used within a ThemeProvider
 * Returns default theme if context not available (prevents crashes during initialization)
 */
export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default theme instead of throwing - prevents crashes during initialization
    console.warn('useTheme called outside ThemeProvider, using default theme');
    return defaultTheme;
  }
  return context.theme;
};

/**
 * Hook to access theme mode controls
 */
export const useThemeMode = (): Pick<ThemeContextValue, 'themeMode' | 'setThemeMode'> => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return {
    themeMode: context.themeMode,
    setThemeMode: context.setThemeMode,
  };
};

export default ThemeProvider;
