/**
 * Chat Modals
 * Modals for chat actions: block user, delete thread, delete message
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { X, Trash2, Ban, AlertTriangle } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text, Button } from '../slices';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
}

// Block User Modal
interface BlockUserModalProps extends BaseModalProps {
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
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
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

          <Text variant="small" color="muted" center style={styles.warning}>
            لن تتمكن من تلقي رسائل من هذا المستخدم بعد الحظر.
          </Text>

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
              variant="primary"
              onPress={onConfirm}
              disabled={isLoading}
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            >
              {isLoading ? 'جاري الحظر...' : 'حظر المستخدم'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Delete Thread Modal
interface DeleteThreadModalProps extends BaseModalProps {
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
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Trash2 size={40} color={theme.colors.error} />
          </View>

          <Text variant="h4" center style={styles.title}>
            حذف المحادثة
          </Text>

          <Text variant="paragraph" color="secondary" center style={styles.description}>
            هل أنت متأكد من حذف هذه المحادثة؟
          </Text>

          <Text variant="small" color="muted" center style={styles.warning}>
            لن تتمكن من استرجاع الرسائل بعد الحذف. هذا الإجراء نهائي.
          </Text>

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
              variant="primary"
              onPress={onConfirm}
              disabled={isLoading}
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            >
              {isLoading ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Delete Message Modal
interface DeleteMessageModalProps extends BaseModalProps {
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
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Trash2 size={40} color={theme.colors.error} />
          </View>

          <Text variant="h4" center style={styles.title}>
            حذف الرسالة
          </Text>

          <Text variant="paragraph" color="secondary" center style={styles.description}>
            هل أنت متأكد من حذف هذه الرسالة؟
          </Text>

          <Text variant="small" color="muted" center style={styles.warning}>
            لن تتمكن من استرجاع الرسالة بعد الحذف.
          </Text>

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
              variant="primary"
              onPress={onConfirm}
              disabled={isLoading}
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            >
              {isLoading ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Report User Modal
interface ReportUserModalProps extends BaseModalProps {
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
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={40} color={theme.colors.warning} />
          </View>

          <Text variant="h4" center style={styles.title}>
            الإبلاغ عن المستخدم
          </Text>

          <Text variant="paragraph" color="secondary" center style={styles.description}>
            هل تريد الإبلاغ عن هذا المستخدم؟
          </Text>

          <Text variant="small" color="muted" center style={styles.warning}>
            سيتم مراجعة البلاغ من قبل فريق الدعم.
          </Text>

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
              variant="primary"
              onPress={onConfirm}
              disabled={isLoading}
              style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
            >
              {isLoading ? 'جاري الإرسال...' : 'إبلاغ'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      width: '100%',
      maxWidth: 340,
    },
    iconContainer: {
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      marginBottom: theme.spacing.sm,
    },
    description: {
      marginBottom: theme.spacing.xs,
    },
    warning: {
      marginBottom: theme.spacing.lg,
    },
    actions: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
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
