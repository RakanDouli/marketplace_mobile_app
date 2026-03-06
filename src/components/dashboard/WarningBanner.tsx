/**
 * WarningBanner Component
 * Shows warning messages for user account status (warnings, suspension, ban)
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle, X, Ban, Clock } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';

export interface WarningBannerProps {
  warningCount?: number;
  warningMessage?: string | null;
  bannedUntil?: string | null;
  banReason?: string | null;
  onDismiss?: () => void;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  warningCount = 0,
  warningMessage,
  bannedUntil,
  banReason,
  onDismiss,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Check if user is currently suspended
  const isSuspended = useMemo(() => {
    if (!bannedUntil) return false;
    const banDate = new Date(bannedUntil);
    return banDate > new Date();
  }, [bannedUntil]);

  // Format ban date
  const banDateFormatted = useMemo(() => {
    if (!bannedUntil) return null;
    const date = new Date(bannedUntil);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [bannedUntil]);

  // Don't show if no warnings or ban
  if (warningCount === 0 && !isSuspended) {
    return null;
  }

  // Suspended state
  if (isSuspended) {
    return (
      <View style={[styles.banner, styles.suspendedBanner]}>
        <View style={styles.iconContainer}>
          <Ban size={24} color={theme.colors.error} />
        </View>
        <View style={styles.content}>
          <Text variant="paragraph" weight="semibold" style={{ color: theme.colors.error }}>
            حسابك موقوف مؤقتاً
          </Text>
          <Text variant="small" style={{ color: theme.colors.error, marginTop: 4 }}>
            سيتم رفع الإيقاف في: {banDateFormatted}
          </Text>
          {banReason && (
            <Text variant="xs" color="secondary" style={{ marginTop: 4 }}>
              السبب: {banReason}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Warning state
  const getWarningTitle = () => {
    switch (warningCount) {
      case 1:
        return 'تحذير أول';
      case 2:
        return 'تحذير ثاني - قد يتم إيقاف حسابك';
      default:
        return `تحذير (${warningCount})`;
    }
  };

  const getWarningSubtitle = () => {
    if (warningCount === 1) {
      return 'المخالفة القادمة ستؤدي إلى إيقاف الحساب لمدة 7 أيام';
    } else if (warningCount === 2) {
      return 'المخالفة القادمة ستؤدي إلى حظر دائم للحساب';
    }
    return null;
  };

  return (
    <View style={[styles.banner, styles.warningBanner]}>
      <View style={styles.iconContainer}>
        <AlertTriangle size={24} color={theme.colors.warning} />
      </View>
      <View style={styles.content}>
        <Text variant="paragraph" weight="semibold" style={{ color: theme.colors.warning }}>
          {getWarningTitle()}
        </Text>
        {warningMessage && (
          <Text variant="small" color="secondary" style={{ marginTop: 4 }}>
            {warningMessage}
          </Text>
        )}
        {getWarningSubtitle() && (
          <Text variant="xs" color="muted" style={{ marginTop: 4 }}>
            {getWarningSubtitle()}
          </Text>
        )}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} style={styles.dismissButton}>
          <X size={20} color={theme.colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: theme.spacing.md,
      marginStart: theme.spacing.md,
      marginEnd: theme.spacing.md,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
    },
    warningBanner: {
      backgroundColor: '#f59e0b10',
      borderColor: theme.colors.warning,
    },
    suspendedBanner: {
      backgroundColor: '#ef444410',
      borderColor: theme.colors.error,
    },
    iconContainer: {
      marginEnd: theme.spacing.md,
      paddingTop: 2,
    },
    content: {
      flex: 1,
    },
    dismissButton: {
      padding: theme.spacing.xs,
      marginStart: theme.spacing.sm,
    },
  });

export default WarningBanner;
