/**
 * Spacing and sizing system for Shambay Mobile App
 * Based on 4px base unit, matches web frontend SCSS variables
 */

// Base spacing scale (4px increments)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border radius
export const radius = {
  xs: 2,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,  // For circular elements
} as const;

// Layout constants
export const layout = {
  headerHeight: 56,
  bottomNavHeight: 60,
  tabBarHeight: 48,
  inputHeight: 48,
  buttonHeightSm: 36,
  buttonHeightMd: 44,
  buttonHeightLg: 52,
  cardPadding: 16,
  screenPadding: 16,
  listingCardWidth: 160,
  avatarSizeSm: 32,
  avatarSizeMd: 48,
  avatarSizeLg: 80,
} as const;

// Icon sizes
export const iconSize = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

// Shadow elevations (Android & iOS compatible)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 12,
  },
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type Shadow = keyof typeof shadows;
