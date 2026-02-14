/**
 * Color palette for Shambay Mobile App
 * Matches the web frontend SCSS variables
 */

export const colors = {
  // Light theme (default)
  light: {
    // Brand colors
    primary: '#2563eb',      // Blue - main brand color
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',    // Slate
    accent: '#f59e0b',       // Amber

    // Status colors
    success: '#22c55e',      // Green
    successLight: '#dcfce7',
    warning: '#f59e0b',      // Amber
    warningLight: '#fef3c7',
    error: '#ef4444',        // Red
    errorLight: '#fee2e2',
    info: '#3b82f6',         // Blue
    infoLight: '#dbeafe',

    // Backgrounds
    bg: '#f8fafc',           // Page background (slate-50)
    surface: '#ffffff',      // Card/container background
    surfaceHover: '#f1f5f9', // Hover state

    // Borders
    border: '#e2e8f0',       // slate-200
    borderFocus: '#3b82f6',  // Focus ring

    // Text colors
    text: '#1e293b',         // Primary text (slate-800)
    textSecondary: '#64748b', // Secondary text (slate-500)
    textMuted: '#94a3b8',    // Muted text (slate-400)
    textInverse: '#ffffff',  // White text on dark bg

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Account type badges
    individual: '#3b82f6',   // Blue
    dealer: '#f59e0b',       // Amber
    business: '#10b981',     // Emerald
  },

  // Dark theme (future implementation)
  dark: {
    // Brand colors
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    secondary: '#94a3b8',
    accent: '#fbbf24',

    // Status colors
    success: '#22c55e',
    successLight: '#166534',
    warning: '#f59e0b',
    warningLight: '#854d0e',
    error: '#ef4444',
    errorLight: '#991b1b',
    info: '#60a5fa',
    infoLight: '#1e40af',

    // Backgrounds
    bg: '#0f172a',           // slate-900
    surface: '#1e293b',      // slate-800
    surfaceHover: '#334155', // slate-700

    // Borders
    border: '#334155',       // slate-700
    borderFocus: '#60a5fa',

    // Text colors
    text: '#f1f5f9',         // slate-100
    textSecondary: '#94a3b8', // slate-400
    textMuted: '#64748b',    // slate-500
    textInverse: '#0f172a',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Account type badges
    individual: '#60a5fa',
    dealer: '#fbbf24',
    business: '#34d399',
  },
};

// Default to light theme
export type ThemeColors = typeof colors.light;
export default colors;
