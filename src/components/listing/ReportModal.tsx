/**
 * ReportModal Component
 * Modal for reporting a listing or user
 * Design matches web frontend ReportModal
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, Flag } from 'lucide-react-native';
import { Text, Button } from '../slices';
import { useTheme, Theme } from '../../theme';
import { useReportsStore, REPORT_REASONS, ReportReason } from '../../stores/reportsStore';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  entityType: 'listing' | 'user' | 'thread';
  entityId: string;
  reportedUserId: string;
  sellerName?: string;
}

export function ReportModal({
  visible,
  onClose,
  entityType,
  entityId,
  reportedUserId,
  sellerName,
}: ReportModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const { submitReport, isSubmitting } = useReportsStore();

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    const result = await submitReport({
      entityType,
      entityId,
      reportedUserId,
      reason: selectedReason,
      details: details.trim() || undefined,
    });

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setSuccess(false);
    onClose();
  };

  const getEntityLabel = () => {
    switch (entityType) {
      case 'listing':
        return 'الإعلان';
      case 'user':
        return 'المستخدم';
      case 'thread':
        return 'المحادثة';
      default:
        return 'المحتوى';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
            >
              <View style={styles.container}>
                {/* Header with Flag icon in error color */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <X size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                  <View style={styles.headerTitleContainer}>
                    <Flag size={20} color={theme.colors.error} />
                    <Text variant="h4" style={[styles.title, { color: theme.colors.error }]}>
                      الإبلاغ عن {getEntityLabel()}
                    </Text>
                  </View>
                  <View style={styles.placeholder} />
                </View>

                {success ? (
                  /* Success State */
                  <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                      <Check size={40} color={theme.colors.success} />
                    </View>
                    <Text variant="h4" style={styles.successTitle}>
                      تم إرسال البلاغ بنجاح
                    </Text>
                    <Text variant="paragraph" color="secondary" style={styles.successText}>
                      شكراً لك، سنقوم بمراجعة البلاغ في أقرب وقت
                    </Text>
                  </View>
                ) : (
                  /* Report Form */
                  <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Info Section */}
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <Text variant="small" color="secondary">نوع البلاغ:</Text>
                        <Text variant="small" bold>{getEntityLabel()}</Text>
                      </View>
                      {sellerName && (
                        <View style={styles.infoRow}>
                          <Text variant="small" color="secondary">البائع:</Text>
                          <Text variant="small" bold>{sellerName}</Text>
                        </View>
                      )}
                    </View>

                    {/* Reason Selection */}
                    <Text variant="body" bold style={styles.label}>
                      سبب البلاغ *
                    </Text>
                    <View style={styles.reasons}>
                      {REPORT_REASONS.map((reason) => (
                        <TouchableOpacity
                          key={reason.value}
                          style={[
                            styles.reasonItem,
                            selectedReason === reason.value && styles.reasonItemSelected,
                          ]}
                          onPress={() => setSelectedReason(reason.value)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.radio,
                              selectedReason === reason.value && styles.radioSelected,
                            ]}
                          >
                            {selectedReason === reason.value && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                          <Text
                            variant="body"
                            style={[
                              styles.reasonText,
                              selectedReason === reason.value && styles.reasonTextSelected,
                            ]}
                          >
                            {reason.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Details */}
                    <Text variant="body" bold style={styles.label}>
                      تفاصيل إضافية (اختياري)
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="أضف تفاصيل إضافية حول البلاغ..."
                      placeholderTextColor={theme.colors.textMuted}
                      value={details}
                      onChangeText={setDetails}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      textAlign="right"
                    />

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                      <Button
                        variant="outline"
                        onPress={handleClose}
                        style={styles.cancelButton}
                      >
                        إلغاء
                      </Button>
                      <Button
                        variant="danger"
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={!selectedReason || isSubmitting}
                        icon={<Flag size={18} color="#FFFFFF" />}
                        style={styles.submitButton}
                      >
                        إرسال البلاغ
                      </Button>
                    </View>
                  </ScrollView>
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    keyboardAvoid: {
      width: '100%',
    },
    container: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      maxHeight: '90%',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    title: {
      textAlign: 'center',
    },
    placeholder: {
      width: 32,
    },

    // Content
    content: {
      padding: theme.spacing.md,
    },

    // Info Section
    infoSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    infoRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    // Label
    label: {
      textAlign: 'right',
      marginBottom: theme.spacing.sm,
    },

    // Reasons
    reasons: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
    },
    reasonItem: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    reasonItemSelected: {
      borderColor: theme.colors.error,
      backgroundColor: '#FFEBEE', // Light red background
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: theme.colors.error,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.error,
    },
    reasonText: {
      flex: 1,
      textAlign: 'right',
    },
    reasonTextSelected: {
      color: theme.colors.error,
    },

    // Input
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      minHeight: 100,
      fontSize: theme.fontSize.base,
      fontFamily: theme.fontFamily.body,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },

    // Actions
    actions: {
      flexDirection: 'row-reverse',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    cancelButton: {
      flex: 1,
    },
    submitButton: {
      flex: 1,
    },

    // Success
    successContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#E8F5E9', // Light green background
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    successTitle: {
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    successText: {
      textAlign: 'center',
    },
  });

export default ReportModal;
