/**
 * IconText Component
 * Reusable component for displaying icon + text
 * Automatically handles RTL/LTR layout (icon position swaps)
 *
 * Usage:
 * <IconText icon={<MapPin size={16} />} text="Damascus" />
 * <IconText icon={<Eye size={16} />} text="120 views" variant="small" color="muted" />
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface IconTextProps {
  /** Icon element (from lucide-react-native or any ReactNode) */
  icon: React.ReactNode;

  /** Text to display */
  text: string | number;

  /** Text variant (default: 'small') */
  variant?: 'xs' | 'small' | 'body' | 'h4' | 'h3';

  /** Text color (default: 'secondary') */
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'error' | 'warning';

  /** Gap between icon and text (default: 'xs') */
  gap?: 'xs' | 'sm' | 'md';

  /** Custom container style */
  style?: ViewStyle;

  /** Custom text style */
  textStyle?: TextStyle;

  /** Number of lines for text */
  numberOfLines?: number;
}

export function IconText({
  icon,
  text,
  variant = 'small',
  color = 'secondary',
  gap = 'xs',
  style,
  textStyle,
  numberOfLines,
}: IconTextProps) {
  const theme = useTheme();

  // Get gap value from theme
  const gapValue = theme.spacing[gap];

  // Convert text to string if it's a number
  const displayText = typeof text === 'number' ? String(text) : text;

  return (
    <View
      style={[
        styles.container,
        {
          // RTL: row-reverse (icon on right, text on left)
          // LTR: row (icon on left, text on right)
          flexDirection: theme.isRTL ? 'row-reverse' : 'row',
          gap: gapValue,
        },
        style,
      ]}
    >
      {icon}
      <Text variant={variant} color={color} numberOfLines={numberOfLines} style={[numberOfLines ? { flex: 1 } : undefined, textStyle]}>
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

// Export both named and default for flexibility
export default IconText;
