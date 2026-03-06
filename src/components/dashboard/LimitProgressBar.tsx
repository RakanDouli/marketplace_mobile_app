/**
 * LimitProgressBar Component
 * Shows listings usage progress bar with limit information
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle, ChevronLeft, TrendingUp } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';

export interface LimitProgressBarProps {
  currentCount: number;
  maxListings: number;
  onUpgradePress?: () => void;
}

export const LimitProgressBar: React.FC<LimitProgressBarProps> = ({
  currentCount,
  maxListings,
  onUpgradePress,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Calculate percentage
  const percentage = maxListings > 0 ? Math.min((currentCount / maxListings) * 100, 100) : 0;

  // Determine status
  const isAtLimit = maxListings > 0 && currentCount >= maxListings;
  const isOverLimit = maxListings > 0 && currentCount > maxListings;
  const isNearLimit = maxListings > 0 && currentCount >= maxListings * 0.8;

  // Get progress bar color
  const getProgressColor = () => {
    if (isOverLimit) return theme.colors.error;
    if (isAtLimit) return theme.colors.warning;
    if (isNearLimit) return '#f59e0b'; // amber
    return theme.colors.primary;
  };

  // Don't show if unlimited (maxListings = 0)
  if (maxListings === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <TrendingUp size={16} color={theme.colors.textSecondary} />
          <Text variant="small" color="secondary">الإعلانات المستخدمة</Text>
        </View>
        <Text variant="h4" color={isOverLimit ? 'error' : isAtLimit ? 'warning' : undefined}>
          {currentCount} / {maxListings}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentage}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>

      {/* Warning Messages */}
      {isOverLimit && (
        <View style={styles.warningContainer}>
          <AlertTriangle size={14} color={theme.colors.error} />
          <Text variant="xs" color="error" style={styles.warningText}>
            لقد تجاوزت الحد المسموح! قم بأرشفة بعض الإعلانات أو ترقية اشتراكك.
          </Text>
        </View>
      )}

      {isAtLimit && !isOverLimit && (
        <View style={styles.infoContainer}>
          <AlertTriangle size={14} color={theme.colors.warning} />
          <Text variant="xs" color="warning" style={styles.warningText}>
            وصلت للحد الأقصى. قم بأرشفة إعلان أو ترقية اشتراكك لإضافة المزيد.
          </Text>
        </View>
      )}

      {/* Upgrade Button */}
      {(isAtLimit || isNearLimit) && onUpgradePress && (
        <Pressable style={styles.upgradeButton} onPress={onUpgradePress}>
          <Text variant="small" color="primary" weight="medium">
            ترقية الاشتراك
          </Text>
          <ChevronLeft size={16} color={theme.colors.primary} />
        </Pressable>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      marginStart: theme.spacing.md,
      marginEnd: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    progressContainer: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: theme.radius.full,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      backgroundColor: '#ef444410',
      borderRadius: theme.radius.md,
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      backgroundColor: '#f59e0b10',
      borderRadius: theme.radius.md,
    },
    warningText: {
      flex: 1,
    },
    upgradeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.radius.md,
    },
  });

export default LimitProgressBar;
