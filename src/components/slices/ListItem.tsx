/**
 * ListItem Component
 * Reusable navigation/menu item with icon, label, and directional arrow
 * Used in: Menu, Settings, Filters, Search results
 */

import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export type ListItemSize = 'sm' | 'md' | 'lg';

export interface ListItemProps {
  /** Main label text */
  label: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Icon to display at the start (before label in reading direction) */
  icon?: React.ReactNode;
  /** Show navigation arrow at the end */
  showArrow?: boolean;
  /** Custom content to show at the end (e.g., badge, count) */
  endContent?: React.ReactNode;
  /** Callback when item is pressed */
  onPress?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is selected/active */
  selected?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Show bottom border (default: true) */
  showBorder?: boolean;
  /** Size variant: sm, md (default), lg */
  size?: ListItemSize;
}

export function ListItem({
  label,
  subtitle,
  icon,
  showArrow = true,
  endContent,
  onPress,
  disabled = false,
  selected = false,
  style,
  showBorder = true,
  size = 'md',
}: ListItemProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);

  // In RTL: icon on right, arrow on left (row-reverse)
  // In LTR: icon on left, arrow on right (row)
  const containerDirection = theme.isRTL ? 'row-reverse' : 'row';

  // Arrow icon - in RTL show ChevronLeft pointing left, in LTR show ChevronRight pointing right
  const ArrowIcon = theme.isRTL ? ChevronLeft : ChevronRight;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { flexDirection: containerDirection },
        showBorder && styles.withBorder,
        selected && styles.selected,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Start section: Icon */}
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}

      {/* Middle section: Label and subtitle */}
      <View style={[
        styles.content,
        { alignItems: theme.isRTL ? 'flex-end' : 'flex-start' },
      ]}>
        <Text
          variant="body"
          style={[
            styles.label,
            { textAlign: theme.isRTL ? 'right' : 'left' },
            selected && { color: theme.colors.primary },
          ]}
        >
          {label}
        </Text>
        {subtitle && (
          <Text
            variant="small"
            color="secondary"
            style={{ textAlign: theme.isRTL ? 'right' : 'left' }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* End section: Custom content or arrow */}
      {endContent && (
        <View style={styles.endContent}>
          {endContent}
        </View>
      )}

      {showArrow && (
        <ArrowIcon
          size={SIZE_CONFIG[size].arrowSize}
          color={disabled ? theme.colors.border : theme.colors.textMuted}
        />
      )}
    </TouchableOpacity>
  );
}

const SIZE_CONFIG = {
  sm: { paddingVertical: 10, iconSize: 20, arrowSize: 16, gap: 8 },
  md: { paddingVertical: 14, iconSize: 24, arrowSize: 20, gap: 12 },
  lg: { paddingVertical: 18, iconSize: 32, arrowSize: 24, gap: 16 },
};

const createStyles = (theme: Theme, size: ListItemSize) => {
  const sizeConfig = SIZE_CONFIG[size];

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.bg,
      gap: sizeConfig.gap,
    },
    withBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    selected: {
      backgroundColor: theme.colors.primaryLight,
    },
    disabled: {
      opacity: 0.5,
    },
    iconContainer: {
      width: sizeConfig.iconSize,
      height: sizeConfig.iconSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    label: {
      fontWeight: '500',
    },
    endContent: {
      marginHorizontal: theme.spacing.xs,
    },
  });
};

export default ListItem;
