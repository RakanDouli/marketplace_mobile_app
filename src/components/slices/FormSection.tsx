/**
 * FormSection Component
 * Collapsible form section with validation status indicators
 * Matches web frontend pattern for edit listing forms
 *
 * Status States:
 * - 'incomplete': Required fields missing (gray border, shows number)
 * - 'required': Required fields filled (green border, green check)
 * - 'complete': All fields filled (green background, white check)
 * - 'error': Validation errors present (red border)
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from './Text';
import { Collapsible } from './Collapsible';
import { useTheme, Theme } from '../../theme';

export type FormSectionStatus = 'incomplete' | 'required' | 'complete' | 'error';

export interface FormSectionProps {
  /** Section number (1, 2, 3...) - shown when incomplete */
  number: number;
  /** Section title */
  title: string;
  /** Section completion status */
  status: FormSectionStatus;
  /** Number of filled fields (for X/Y display) */
  filledCount?: number;
  /** Total number of fields (for X/Y display) */
  totalCount?: number;
  /** Whether this section has validation errors */
  hasError?: boolean;
  /** Whether this section contains required fields (shows asterisk) */
  hasRequiredFields?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Callback when section is toggled */
  onToggle?: (expanded: boolean) => void;
  /** Content padding size */
  contentPadding?: 'sm' | 'md' | 'lg';
  /** Children content */
  children: React.ReactNode;
  /** Additional container style */
  style?: ViewStyle;
}

export function FormSection({
  number,
  title,
  status,
  filledCount,
  totalCount,
  hasError = false,
  hasRequiredFields = false,
  defaultExpanded = false,
  onToggle,
  contentPadding = 'md',
  children,
  style,
}: FormSectionProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Determine actual status (error takes priority)
  const actualStatus = hasError ? 'error' : status;

  // Show field count if provided
  const showFieldCount = filledCount !== undefined && totalCount !== undefined;

  // Get border color based on status
  const getBorderStyle = (): ViewStyle => {
    switch (actualStatus) {
      case 'error':
        return { borderColor: theme.colors.error };
      case 'complete':
        return {
          borderColor: theme.colors.success,
          shadowColor: theme.colors.success,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 2,
        };
      case 'required':
        return { borderColor: theme.colors.success };
      default:
        return { borderColor: theme.colors.border };
    }
  };

  // Get indicator style based on status
  const getIndicatorStyle = (): ViewStyle => {
    switch (actualStatus) {
      case 'error':
        return {
          borderColor: theme.colors.error,
          backgroundColor: 'transparent',
        };
      case 'complete':
        return {
          borderColor: theme.colors.success,
          backgroundColor: theme.colors.success,
        };
      case 'required':
        return {
          borderColor: theme.colors.success,
          backgroundColor: 'transparent',
        };
      default:
        return {
          borderColor: theme.colors.border,
          backgroundColor: 'transparent',
        };
    }
  };

  // Get indicator content color
  const getIndicatorColor = (): string => {
    switch (actualStatus) {
      case 'error':
        return theme.colors.error;
      case 'complete':
        return '#FFFFFF'; // White check on green background
      case 'required':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  // Custom header content
  const headerContent = (
    <View style={[styles.header, theme.rtl.flexDirection.row()]}>
      {/* Status Indicator */}
      <View style={[styles.indicator, getIndicatorStyle()]}>
        {actualStatus === 'complete' || actualStatus === 'required' ? (
          <Check size={14} color={getIndicatorColor()} strokeWidth={3} />
        ) : (
          <Text
            variant="small"
            bold
            style={{ color: getIndicatorColor() }}
          >
            {number}
          </Text>
        )}
      </View>

      {/* Title Group */}
      <View style={[
        styles.titleGroup,
        theme.rtl.alignItems.start()
      ]}>
        <View style={[styles.titleRow, theme.rtl.flexDirection.row()]}>
          <Text variant="body" bold style={styles.title}>
            {title}
          </Text>
          {hasRequiredFields && (
            <Text variant="body" bold style={styles.asterisk}>*</Text>
          )}
        </View>

        {showFieldCount && (
          <Text variant="xs" color="secondary" style={styles.fieldCount}>
            {filledCount}/{totalCount}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Collapsible
      title={headerContent}
      defaultOpen={defaultExpanded}
      onToggle={onToggle}
      variant="form"
      contentPadding={contentPadding}
      style={getBorderStyle()}
    >
      {children}
    </Collapsible>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    indicator: {
      width: 28,
      height: 28,
      borderRadius: theme.radius.full,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleGroup: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    titleRow: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    title: {
      color: theme.colors.text,
    },
    asterisk: {
      color: theme.colors.error,
    },
    fieldCount: {
      fontVariant: ['tabular-nums'],
    },
  });

export default FormSection;
