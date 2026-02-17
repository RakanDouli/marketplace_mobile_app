/**
 * Collapsible Component
 * Expandable/collapsible content container for FAQ sections
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { Text } from '../ui/Text';
import { useTheme } from '../../theme';

// Note: setLayoutAnimationEnabledExperimental is not needed on New Architecture (Expo 52+)
// LayoutAnimation works natively without enabling it

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'bordered' | 'card' | 'accent';
  onToggle?: (isOpen: boolean) => void;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  variant = 'default',
  onToggle,
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

  const getContainerStyle = () => {
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
      default:
        return {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        };
    }
  };

  return (
    <View style={[styles.container, getContainerStyle()]}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        {/* RTL: Icon left, title right */}
        <View style={[
          styles.toggleIcon,
          variant === 'accent' && { backgroundColor: theme.colors.primaryLight }
        ]}>
          {isOpen ? (
            <Minus size={18} color={variant === 'accent' ? theme.colors.primary : theme.colors.text} />
          ) : (
            <Plus size={18} color={variant === 'accent' ? theme.colors.primary : theme.colors.text} />
          )}
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    toggleIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.md,
    },
    title: {
      flex: 1,
      fontSize: theme.fontSize.base,
      fontFamily: theme.fontFamily.bodyMedium,
      textAlign: 'right',
    },
    content: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
  });

export default Collapsible;
