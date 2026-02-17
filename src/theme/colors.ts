/**
 * Color palette for Shambay Mobile App
 * Matches the web frontend SCSS variables
 */

export const colors = {
  // Light theme (default)
  light: {
    // Brand colors - Matching web frontend themes.scss
    primary: 'rgb(61, 92, 182)',       // Syrian blue (web: --primary)
    primaryLight: 'rgba(61, 92, 182, 0.15)',
    primaryDark: 'rgb(41, 72, 162)',
    secondary: 'rgb(216, 80, 32)',     // Orange (web: --secondary)
    accent: 'rgb(234, 76, 137)',       // Pink (web: --accent)
    accentBg: 'rgba(234, 76, 137, 0.2)',

    // Status colors - Matching web frontend themes.scss
    success: 'rgb(39, 174, 96)',       // Green (web: --success)
    successLight: 'rgba(39, 174, 96, 0.15)',
    warning: 'rgb(243, 156, 18)',      // Amber (web: --warning)
    warningLight: 'rgba(243, 156, 18, 0.15)',
    error: 'rgb(231, 76, 60)',         // Red (web: --error)
    errorLight: 'rgba(231, 76, 60, 0.15)',
    info: 'rgb(52, 152, 219)',         // Blue (web: --info)
    infoLight: 'rgba(52, 152, 219, 0.15)',

    // Backgrounds - Matching web frontend themes.scss
    bg: '#ffffff',           // Pure white (web: --bg-light)
    surface: '#f8f8f8',      // Light gray (web: --bg-body-light)
    surfaceHover: '#f1f5f9', // Hover state

    // Borders
    border: '#e5e7eb',       // Light border (web: --border-light)
    borderFocus: 'rgb(61, 92, 182)',  // Focus ring

    // Text colors - Matching web frontend themes.scss
    text: '#0f172a',         // Dark text (web: --text-header)
    textSecondary: '#4b5563', // Secondary text (web: --text-secondary)
    textMuted: '#1e293b',    // Muted text (web: --text-body-dark)
    textInverse: '#f8fafc',  // Light text (web: --text-light)

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Account type badges
    individual: 'rgb(52, 152, 219)',   // Blue (info)
    dealer: 'rgb(243, 156, 18)',       // Amber (warning)
    business: 'rgb(39, 174, 96)',      // Green (success)
  },

  // Dark theme - Matching web frontend themes.scss
  dark: {
    // Brand colors
    primary: 'rgb(61, 92, 182)',
    primaryLight: 'rgba(61, 92, 182, 0.2)',
    primaryDark: 'rgb(41, 72, 162)',
    secondary: 'rgb(216, 80, 32)',
    accent: 'rgb(234, 76, 137)',
    accentBg: 'rgba(234, 76, 137, 0.2)',

    // Status colors
    success: 'rgb(39, 174, 96)',
    successLight: 'rgba(39, 174, 96, 0.2)',
    warning: 'rgb(243, 156, 18)',
    warningLight: 'rgba(243, 156, 18, 0.2)',
    error: 'rgb(231, 76, 60)',
    errorLight: 'rgba(231, 76, 60, 0.2)',
    info: 'rgb(52, 152, 219)',
    infoLight: 'rgba(52, 152, 219, 0.2)',

    // Backgrounds - Matching web frontend themes.scss
    bg: '#0f172a',           // Dark (web: --bg-dark)
    surface: '#1e293b',      // Medium gray (web: --bg-body-dark)
    surfaceHover: '#334155',

    // Borders
    border: '#374151',       // Dark border (web: --border-dark)
    borderFocus: 'rgb(61, 92, 182)',

    // Text colors - Matching web frontend themes.scss
    text: '#f8fafc',         // Light text (web: --text-light)
    textSecondary: '#9ca3af', // Secondary text
    textMuted: '#e8eaee',    // Muted text (web: --text-body-light)
    textInverse: '#0f172a',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Account type badges
    individual: 'rgb(52, 152, 219)',
    dealer: 'rgb(243, 156, 18)',
    business: 'rgb(39, 174, 96)',
  },
};

// Default to light theme
export type ThemeColors = typeof colors.light;
export default colors;
