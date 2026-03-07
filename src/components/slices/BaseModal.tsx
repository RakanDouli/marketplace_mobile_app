/**
 * BaseModal Component
 * Standardized modal with consistent header across the app
 *
 * Header Layout (ALWAYS same regardless of RTL/LTR):
 * [X Close] -------- [Title] -------- [Right Action?]
 *
 * This ensures consistency - close button always on left
 */

import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

export interface BaseModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Modal title (centered) */
  title?: string;
  /** Subtitle under title */
  subtitle?: string;
  /** Icon to show next to title */
  titleIcon?: React.ReactNode;
  /** Title color (for special modals like report) */
  titleColor?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Right side action button (icon) */
  rightAction?: React.ReactNode;
  /** Show close button (default: true) */
  showCloseButton?: boolean;
  /** Maximum height as percentage (default: 80) */
  maxHeightPercent?: number;
  /** Whether to show as bottom sheet (default: true) or center modal */
  position?: 'bottom' | 'center';
  /** Disable scroll (for custom scroll handling) */
  disableScroll?: boolean;
  /** Custom padding for body */
  bodyPadding?: 'none' | 'sm' | 'md' | 'lg';
  /** Footer content (fixed at bottom) */
  footer?: React.ReactNode;
  /** Whether tapping backdrop closes modal (default: true) */
  closeOnBackdropPress?: boolean;
}

export function BaseModal({
  visible,
  onClose,
  title,
  subtitle,
  titleIcon,
  titleColor,
  children,
  rightAction,
  showCloseButton = true,
  maxHeightPercent = 80,
  position = 'bottom',
  disableScroll = false,
  bodyPadding = 'lg',
  footer,
  closeOnBackdropPress = true,
}: BaseModalProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, maxHeightPercent, position, bodyPadding),
    [theme, maxHeightPercent, position, bodyPadding]
  );

  const hasHeader = title || showCloseButton || rightAction;

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Animate when visible changes
  useEffect(() => {
    if (visible) {
      // Reset to initial state first
      slideAnim.setValue(0);
      backdropOpacity.setValue(0);

      // Show: backdrop fades in, content slides up
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      // Hide: both animate out
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, slideAnim]);

  // Calculate slide transform based on position
  const slideTransform = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'bottom' ? [300, 0] : [0, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeOnBackdropPress ? onClose : undefined}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        {/* Backdrop - fades in/out */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeOnBackdropPress ? onClose : undefined}
          />
        </Animated.View>

        {/* Content Container - slides up */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideTransform }],
            },
          ]}
        >
          {/* Header - Close button ALWAYS on left for consistency */}
          {hasHeader && (
            <View style={styles.header}>
              {/* Left: Close Button */}
              {showCloseButton ? (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerButtonPlaceholder} />
              )}

              {/* Center: Title */}
              <View style={styles.headerCenter}>
                {titleIcon && (
                  <View style={styles.titleIcon}>{titleIcon}</View>
                )}
                {title && (
                  <Text
                    variant="h4"
                    style={[styles.title, titleColor && { color: titleColor }]}
                  >
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text variant="small" color="secondary" numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>

              {/* Right: Action or Placeholder */}
              {rightAction ? (
                <View style={styles.headerButton}>{rightAction}</View>
              ) : (
                <View style={styles.headerButtonPlaceholder} />
              )}
            </View>
          )}

          {/* Body */}
          {disableScroll ? (
            <View style={styles.bodyNoScroll}>{children}</View>
          ) : (
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          )}

          {/* Footer */}
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (
  theme: Theme,
  maxHeightPercent: number,
  position: 'bottom' | 'center',
  bodyPadding: 'none' | 'sm' | 'md' | 'lg'
) => {
  const paddingMap = {
    none: 0,
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
  };

  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: position === 'bottom' ? 'flex-end' : 'center',
      alignItems: position === 'center' ? 'center' : undefined,
      padding: position === 'center' ? theme.spacing.lg : 0,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      borderBottomLeftRadius: position === 'center' ? theme.radius.xl : 0,
      borderBottomRightRadius: position === 'center' ? theme.radius.xl : 0,
      maxHeight: `${maxHeightPercent}%`,
      width: position === 'center' ? '100%' : undefined,
      maxWidth: position === 'center' ? 400 : undefined,
      overflow: 'hidden',
    },

    // Header - Always: [Close] [Title] [Action]
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      minHeight: 56,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.full,
    },
    headerButtonPlaceholder: {
      width: 44,
      height: 44,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
    },
    titleIcon: {
      marginBottom: theme.spacing.xs,
    },
    title: {
      textAlign: 'center',
    },

    // Body
    body: {
      flexGrow: 0,
      flexShrink: 1,
    },
    bodyContent: {
      padding: paddingMap[bodyPadding],
      paddingBottom: paddingMap[bodyPadding] + 20, // Extra for safe area
    },
    bodyNoScroll: {
      padding: paddingMap[bodyPadding],
    },

    // Footer
    footer: {
      paddingStart: theme.spacing.lg,
      paddingEnd: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
};

export default BaseModal;
