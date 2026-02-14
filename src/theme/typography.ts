/**
 * Typography system for Shambay Mobile App
 * Optimized for Arabic RTL with proper font families
 */

// Font families - loaded via expo-font
export const fontFamily = {
  // Headers (Arabic-optimized)
  header: 'Beiruti-Bold',
  headerMedium: 'Beiruti-SemiBold',
  headerLight: 'Beiruti-Regular',

  // Body text (Arabic-optimized)
  body: 'Rubik-Regular',
  bodyMedium: 'Rubik-Medium',
  bodySemibold: 'Rubik-SemiBold',
  bodyBold: 'Rubik-Bold',
} as const;

// Font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// Line heights (as multipliers)
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Font weights (React Native compatible)
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

// Pre-defined text styles for consistency
export const textStyles = {
  // Headers
  h1: {
    fontFamily: fontFamily.header,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontFamily: fontFamily.header,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
  h3: {
    fontFamily: fontFamily.headerMedium,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
    fontWeight: fontWeight.semibold,
  },
  h4: {
    fontFamily: fontFamily.headerMedium,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    fontWeight: fontWeight.semibold,
  },
  h5: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    fontWeight: fontWeight.medium,
  },
  h6: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    fontWeight: fontWeight.medium,
  },

  // Body text
  paragraph: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.relaxed,
    fontWeight: fontWeight.normal,
  },
  small: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    fontWeight: fontWeight.normal,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    fontWeight: fontWeight.normal,
  },

  // Special
  button: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.tight,
    fontWeight: fontWeight.semibold,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    fontWeight: fontWeight.medium,
  },
  price: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
} as const;

export type TextStyleKey = keyof typeof textStyles;
