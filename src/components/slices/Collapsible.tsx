/**
 * Collapsible Component
 * Expandable/collapsible content container
 * Supports string or ReactNode title for custom headers (like FormSection)
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutAnimation, ViewStyle } from 'react-native';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Text } from './Text';
import { useTheme, Theme } from '../../theme';

export interface CollapsibleProps {
  /** Title can be a string or ReactNode for custom headers */
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'bordered' | 'card' | 'accent' | 'form';
  /** Content padding size */
  contentPadding?: 'sm' | 'md' | 'lg';
  /** Custom container style */
  style?: ViewStyle;
  /** Callback when toggled */
  onToggle?: (isOpen: boolean) => void;
  /** Use chevron icons instead of plus/minus */
  useChevron?: boolean;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  variant = 'default',
  contentPadding = 'md',
  style,
  onToggle,
  useChevron = false,
}: CollapsibleProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'bordered':
        return {
          backgroundColor: theme.colors.bg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          marginBottom: theme.spacing.sm,
        };
      case 'card':
        return {
          backgroundColor: theme.colors.bg,
          borderRadius: theme.radius.md,
          marginBottom: theme.spacing.sm,
          ...theme.shadows.sm,
        };
      case 'accent':
        return {
          backgroundColor: theme.colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        };
      case 'form':
        return {
          backgroundColor: theme.colors.bg,
          borderWidth: 2,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          marginBottom: theme.spacing.md,
          overflow: 'hidden',
        };
      default:
        return {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        };
    }
  };

  const getContentPadding = () => {
    switch (contentPadding) {
      case 'sm':
        return { padding: theme.spacing.sm };
      case 'lg':
        return { padding: theme.spacing.lg };
      default:
        return { padding: theme.spacing.md };
    }
  };

  const IconComponent = useChevron
    ? (isOpen ? ChevronUp : ChevronDown)
    : (isOpen ? Minus : Plus);

  const iconColor = variant === 'accent' || variant === 'form'
    ? theme.colors.primary
    : theme.colors.text;

  const showIconBackground = variant === 'accent' || variant === 'form';

  // Check if title is a string or ReactNode
  const isStringTitle = typeof title === 'string';

  return (
    <View style={[styles.container, getContainerStyle(), style]}>
      <TouchableOpacity
        style={[
          styles.trigger,
          { flexDirection: 'row' },  // Always row, no reverse
          variant === 'form' && styles.formTrigger,
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        {/* Toggle Icon - FIRST in RTL, LAST in LTR */}
        {theme.isRTL && (
          <View style={[
            styles.toggleIcon,
            showIconBackground && { backgroundColor: theme.colors.primaryLight }
          ]}>
            <IconComponent size={18} color={iconColor} />
          </View>
        )}

        {/* Title - either string Text or custom ReactNode */}
        <View style={styles.titleContainer}>
          {isStringTitle ? (
            <Text
              variant="body"
              bold
              style={[styles.title, { textAlign: theme.isRTL ? 'right' : 'left' }]}
            >
              {title}
            </Text>
          ) : (
            title
          )}
        </View>

        {/* Toggle Icon - LAST in LTR */}
        {!theme.isRTL && (
          <View style={[
            styles.toggleIcon,
            showIconBackground && { backgroundColor: theme.colors.primaryLight }
          ]}>
            <IconComponent size={18} color={iconColor} />
          </View>
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={[
          styles.content,
          getContentPadding(),
          variant === 'form' && styles.formContent,
        ]}>
          {children}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
    },
    trigger: {
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
    },
    formTrigger: {
      paddingVertical: theme.spacing.sm,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.fontSize.base,
      fontFamily: theme.fontFamily.bodyMedium,
    },
    toggleIcon: {
      width: 28,
      height: 28,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    formContent: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
    },
  });

export default Collapsible;
