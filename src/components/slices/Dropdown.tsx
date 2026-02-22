/**
 * Dropdown Component
 * Reusable dropdown menu triggered by a button
 *
 * Usage:
 * <Dropdown
 *   trigger={<Button icon={<MoreVertical />} />}
 *   align="right"
 * >
 *   <DropdownMenuItem
 *     icon={<Edit2 size={16} />}
 *     label="تعديل"
 *     onPress={() => {}}
 *   />
 *   <DropdownMenuItem
 *     icon={<Trash2 size={16} />}
 *     label="حذف"
 *     onPress={() => {}}
 *     danger
 *   />
 * </Dropdown>
 */

import React, { useState, useRef, useMemo, ReactNode, ReactElement } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  LayoutRectangle,
  Dimensions,
} from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// ==================== DropdownMenuItem ====================

export interface DropdownMenuItemProps {
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  description?: string;
}

export function DropdownMenuItem({
  icon,
  label,
  onPress,
  danger = false,
  disabled = false,
  description,
}: DropdownMenuItemProps) {
  const theme = useTheme();
  const styles = useMemo(() => createMenuItemStyles(theme), [theme]);

  const textColor = danger ? theme.colors.error : disabled ? theme.colors.textMuted : theme.colors.text;

  return (
    <TouchableOpacity
      style={[styles.menuItem, disabled && styles.menuItemDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text variant="body" style={{ color: textColor }}>
          {label}
        </Text>
        {description && (
          <Text variant="small" color="muted">
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createMenuItemStyles = (theme: Theme) =>
  StyleSheet.create({
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
    },
    menuItemDisabled: {
      opacity: 0.5,
    },
    iconContainer: {
      width: 20,
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
    },
  });

// ==================== DropdownSeparator ====================

export function DropdownSeparator() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.xs,
      }}
    />
  );
}

// ==================== Dropdown ====================

export interface DropdownProps {
  trigger: ReactElement;
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  isOpen: controlledIsOpen,
  onOpenChange,
}: DropdownProps) {
  const theme = useTheme();
  const styles = useMemo(() => createDropdownStyles(theme), [theme]);
  const triggerRef = useRef<View>(null);

  // Internal state (if not controlled)
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null);

  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalIsOpen(value);
    }
  };

  // Measure trigger position
  const measureTrigger = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
    });
  };

  // Handle open
  const handleOpen = () => {
    measureTrigger();
    setIsOpen(true);
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
  };

  // Clone trigger with onPress handler
  const clonedTrigger = React.cloneElement(trigger, {
    onPress: () => {
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
      // Also call original onPress if exists
      trigger.props.onPress?.();
    },
  });

  // Calculate menu position
  const getMenuPosition = () => {
    if (!triggerLayout) return { top: 0, left: 0 };

    const menuWidth = 220;
    const estimatedMenuHeight = 200; // Approximate menu height
    let top = triggerLayout.y + triggerLayout.height + 8;

    let left = triggerLayout.x;
    if (align === 'right') {
      left = triggerLayout.x + triggerLayout.width - menuWidth;
    } else if (align === 'center') {
      left = triggerLayout.x + (triggerLayout.width - menuWidth) / 2;
    }

    // Keep menu on screen horizontally
    if (left < 16) left = 16;
    if (left + menuWidth > SCREEN_WIDTH - 16) {
      left = SCREEN_WIDTH - menuWidth - 16;
    }

    // Keep menu on screen vertically - show above trigger if not enough space below
    if (top + estimatedMenuHeight > SCREEN_HEIGHT - 50) {
      top = triggerLayout.y - estimatedMenuHeight - 8;
    }

    return { top, left };
  };

  const menuPosition = getMenuPosition();

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        {clonedTrigger}
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <View
            style={[
              styles.menuContainer,
              {
                top: menuPosition.top,
                left: menuPosition.left,
              },
            ]}
          >
            {/* Pass close handler to children */}
            {React.Children.map(children, (child) => {
              if (React.isValidElement<DropdownMenuItemProps>(child) && child.type === DropdownMenuItem) {
                return React.cloneElement(child, {
                  onPress: () => {
                    child.props.onPress?.();
                    handleClose();
                  },
                });
              }
              return child;
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createDropdownStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    menuContainer: {
      position: 'absolute',
      minWidth: 160,
      maxWidth: 250,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.xs,
      // iOS shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      // Android shadow
      elevation: 8,
    },
  });

export default Dropdown;
