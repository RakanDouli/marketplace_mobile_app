/**
 * Theme Context Provider for Shambay Mobile App
 * Provides theme values (colors, spacing, typography) to all components
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import colors, { ThemeColors } from './colors';
import { spacing, radius, layout, iconSize, shadows } from './spacing';
import { fontFamily, fontSize, fontWeight, lineHeight, textStyles } from './typography';

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

  // Determine actual theme based on mode
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  // Build full theme object
  const theme: Theme = {
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
  };

  const contextValue: ThemeContextValue = {
    theme,
    themeMode,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme values
 * Must be used within a ThemeProvider
 */
export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
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
