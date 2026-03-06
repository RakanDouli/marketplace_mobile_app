/**
 * Chat Modals
 * Modals for chat actions: block user, delete thread, delete message
 * Uses BaseModal for consistent styling
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Trash2, Ban, AlertTriangle } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text, Button, BaseModal } from '../slices';

interface ChatModalBaseProps {
  visible: boolean;
  onClose: () => void;
}

// Block User Modal
interface BlockUserModalProps extends ChatModalBaseProps {
  onConfirm: () => void;
  userName?: string;
  isLoading?: boolean;
}

export function BlockUserModal({
  visible,
  onClose,
  onConfirm,
  userName,
  isLoading,
}: BlockUserModalProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const footer = (
    <View style={styles.actions}>
      <Button
        variant="outline"
        onPress={onClose}
        disabled={isLoading}
        style={styles.actionButton}
      >
        إلغاء
      </Button>
      <Button
        variant="danger"
        onPress={onConfirm}
        disabled={isLoading}
        style={styles.actionButton}
      >
        {isLoading ? 'جاري الحظر...' : 'حظر المستخدم'}
      </Button>
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      position="center"
      showCloseButton={false}
      footer={footer}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorLight }]}>
          <Ban size={40} color={theme.colors.error} />
        </View>

        <Text variant="h4" center style={styles.title}>
          حظر المستخدم
        </Text>

        <Text variant="paragraph" color="secondary" center style={styles.description}>
          {userName
            ? `هل أنت متأكد من حظر "${userName}"؟`
            : 'هل أنت متأكد من حظر هذا المستخدم؟'}
        </Text>

        <Text variant="small" color="muted" center>
          لن تتمكن من تلقي رسائل من هذا المستخدم بعد الحظر.
        </Text>
      </View>
    </BaseModal>
  );
}

// Delete Thread Modal
interface DeleteThreadModalProps extends ChatModalBaseProps {
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteThreadModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
}: DeleteThreadModalProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const footer = (
    <View style={styles.actions}>
      <Button
        variant="outline"
        onPress={onClose}
        disabled={isLoading}
        style={styles.actionButton}
      >
        إلغاء
      </Button>
      <Button
        variant="danger"
        onPress={onConfirm}
        disabled={isLoading}
        style={styles.actionButton}
      >
        {isLoading ? 'جاري الحذف...' : 'حذف'}
      </Button>
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      position="center"
      showCloseButton={false}
      footer={footer}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorLight }]}>
          <Trash2 size={40} color={theme.colors.error} />
        </View>

        <Text variant="h4" center style={styles.title}>
          حذف المحادثة
        </Text>

        <Text variant="paragraph" color="secondary" center style={styles.description}>
          هل أنت متأكد من حذف هذه المحادثة؟
        </Text>

        <Text variant="small" color="muted" center>
          لن تتمكن من استرجاع الرسائل بعد الحذف. هذا الإجراء نهائي.
        </Text>
      </View>
    </BaseModal>
  );
}

// Delete Message Modal
interface DeleteMessageModalProps extends ChatModalBaseProps {
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteMessageModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
}: DeleteMessageModalProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const footer = (
    <View style={styles.actions}>
      <Button
        variant="outline"
        onPress={onClose}
        disabled={isLoading}
        style={styles.actionButton}
      >
        إلغاء
      </Button>
      <Button
        variant="danger"
        onPress={onConfirm}
        disabled={isLoading}
        style={styles.actionButton}
      >
        {isLoading ? 'جاري الحذف...' : 'حذف'}
      </Button>
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      position="center"
      showCloseButton={false}
      footer={footer}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorLight }]}>
          <Trash2 size={40} color={theme.colors.error} />
        </View>

        <Text variant="h4" center style={styles.title}>
          حذف الرسالة
        </Text>

        <Text variant="paragraph" color="secondary" center style={styles.description}>
          هل أنت متأكد من حذف هذه الرسالة؟
        </Text>

        <Text variant="small" color="muted" center>
          لن تتمكن من استرجاع الرسالة بعد الحذف.
        </Text>
      </View>
    </BaseModal>
  );
}

// Report User Modal
interface ReportUserModalProps extends ChatModalBaseProps {
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ReportUserModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
}: ReportUserModalProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const footer = (
    <View style={styles.actions}>
      <Button
        variant="outline"
        onPress={onClose}
        disabled={isLoading}
        style={styles.actionButton}
      >
        إلغاء
      </Button>
      <Button
        variant="warning"
        onPress={onConfirm}
        disabled={isLoading}
        style={styles.actionButton}
      >
        {isLoading ? 'جاري الإرسال...' : 'إبلاغ'}
      </Button>
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      position="center"
      showCloseButton={false}
      footer={footer}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.warningLight }]}>
          <AlertTriangle size={40} color={theme.colors.warning} />
        </View>

        <Text variant="h4" center style={styles.title}>
          الإبلاغ عن المستخدم
        </Text>

        <Text variant="paragraph" color="secondary" center style={styles.description}>
          هل تريد الإبلاغ عن هذا المستخدم؟
        </Text>

        <Text variant="small" color="muted" center>
          سيتم مراجعة البلاغ من قبل فريق الدعم.
        </Text>
      </View>
    </BaseModal>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    content: {
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      marginBottom: theme.spacing.sm,
    },
    description: {
      marginBottom: theme.spacing.xs,
    },
    actions: {
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
  });

export default {
  BlockUserModal,
  DeleteThreadModal,
  DeleteMessageModal,
  ReportUserModal,
};
