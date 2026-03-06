/**
 * RTL Utilities
 * Professional RTL support following React Native best practices
 *
 * Key Principles:
 * 1. Use logical properties (start/end) instead of physical (left/right)
 * 2. Use I18nManager.isRTL for conditional logic (not forceRTL)
 * 3. Mirror layouts, icons, and animations properly
 */

import { I18nManager, TextStyle, ViewStyle } from 'react-native';

/**
 * Get current RTL status
 * Use this instead of checking language directly
 */
export const isRTL = (): boolean => {
  return I18nManager.isRTL;
};

/**
 * Logical spacing - automatically flips in RTL
 * Use these instead of marginLeft/Right, paddingLeft/Right
 */
export const spacing = {
  /**
   * Margin at the start of reading direction
   * LTR: marginLeft, RTL: marginRight
   */
  marginStart: (value: number): ViewStyle => ({
    marginStart: value,
  }),

  /**
   * Margin at the end of reading direction
   * LTR: marginRight, RTL: marginLeft
   */
  marginEnd: (value: number): ViewStyle => ({
    marginEnd: value,
  }),

  /**
   * Padding at the start of reading direction
   */
  paddingStart: (value: number): ViewStyle => ({
    paddingStart: value,
  }),

  /**
   * Padding at the end of reading direction
   */
  paddingEnd: (value: number): ViewStyle => ({
    paddingEnd: value,
  }),

  /**
   * Horizontal margins (start and end)
   */
  marginHorizontal: (value: number): ViewStyle => ({
    marginStart: value,
    marginEnd: value,
  }),

  /**
   * Horizontal padding (start and end)
   */
  paddingHorizontal: (value: number): ViewStyle => ({
    paddingStart: value,
    paddingEnd: value,
  }),
};

/**
 * Text alignment based on RTL
 */
export const textAlign = {
  /**
   * Align text to start of reading direction
   * LTR: left, RTL: right
   */
  start: (): TextStyle => ({
    textAlign: isRTL() ? 'right' : 'left',
  }),

  /**
   * Align text to end of reading direction
   * LTR: right, RTL: left
   */
  end: (): TextStyle => ({
    textAlign: isRTL() ? 'left' : 'right',
  }),

  /**
   * Center (same in both directions)
   */
  center: (): TextStyle => ({
    textAlign: 'center',
  }),
};

/**
 * Flex direction based on RTL
 */
export const flexDirection = {
  /**
   * Row direction respecting RTL
   * LTR: row, RTL: row-reverse
   */
  row: (): ViewStyle => ({
    flexDirection: isRTL() ? 'row-reverse' : 'row',
  }),

  /**
   * Column (same in both directions)
   */
  column: (): ViewStyle => ({
    flexDirection: 'column',
  }),
};

/**
 * Align items based on RTL
 */
export const alignItems = {
  /**
   * Align to start of flex direction
   * LTR: flex-start, RTL: flex-end (when row)
   */
  start: (): ViewStyle => ({
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  }),

  /**
   * Align to end of flex direction
   * LTR: flex-end, RTL: flex-start (when row)
   */
  end: (): ViewStyle => ({
    alignItems: isRTL() ? 'flex-start' : 'flex-end',
  }),

  /**
   * Center (same in both directions)
   */
  center: (): ViewStyle => ({
    alignItems: 'center',
  }),
};

/**
 * Transforms for icons/images that should mirror in RTL
 * Use for directional icons (arrows, chevrons)
 */
export const mirror = (): ViewStyle => ({
  transform: [{ scaleX: isRTL() ? -1 : 1 }],
});

/**
 * Get appropriate chevron direction
 * Returns 'left' or 'right' based on RTL and desired direction
 *
 * @param direction - 'forward' (next) or 'backward' (previous)
 * @returns 'left' or 'right'
 */
export const getChevronDirection = (direction: 'forward' | 'backward'): 'left' | 'right' => {
  if (direction === 'forward') {
    return isRTL() ? 'left' : 'right';
  } else {
    return isRTL() ? 'right' : 'left';
  }
};

/**
 * Animation direction for slide animations
 *
 * @param direction - 'forward' (next screen) or 'backward' (previous screen)
 * @returns Animation direction string
 */
export const getSlideDirection = (
  direction: 'forward' | 'backward'
): 'slide_from_left' | 'slide_from_right' => {
  if (direction === 'forward') {
    return isRTL() ? 'slide_from_left' : 'slide_from_right';
  } else {
    return isRTL() ? 'slide_from_right' : 'slide_from_left';
  }
};

/**
 * Absolute positioning for RTL
 * Use when you must use absolute positioning
 */
export const position = {
  /**
   * Position at start of reading direction
   * LTR: left, RTL: right
   */
  start: (value: number): ViewStyle =>
    isRTL() ? { right: value } : { left: value },

  /**
   * Position at end of reading direction
   * LTR: right, RTL: left
   */
  end: (value: number): ViewStyle =>
    isRTL() ? { left: value } : { right: value },
};

/**
 * Border radius for RTL
 * Useful for directional borders (e.g., left side has radius)
 */
export const borderRadius = {
  /**
   * Radius at start of reading direction
   */
  start: (value: number): ViewStyle =>
    isRTL()
      ? {
          borderTopRightRadius: value,
          borderBottomRightRadius: value,
        }
      : {
          borderTopLeftRadius: value,
          borderBottomLeftRadius: value,
        },

  /**
   * Radius at end of reading direction
   */
  end: (value: number): ViewStyle =>
    isRTL()
      ? {
          borderTopLeftRadius: value,
          borderBottomLeftRadius: value,
        }
      : {
          borderTopRightRadius: value,
          borderBottomRightRadius: value,
        },
};

/**
 * Combine multiple RTL-aware styles
 * Helper to merge styles while preserving RTL logic
 */
export const combineRTLStyles = (...styles: (ViewStyle | TextStyle)[]): ViewStyle | TextStyle => {
  return Object.assign({}, ...styles);
};
