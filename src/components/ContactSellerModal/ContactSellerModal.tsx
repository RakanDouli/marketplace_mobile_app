/**
 * Contact Seller Modal
 * Modal for sending first message to seller with quick templates
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, Theme } from '../../theme';
import { Text, Button } from '../slices';
import { useChatStore } from '../../stores/chatStore';

const QUICK_MESSAGES = [
  'هل هذا الإعلان لا يزال متاحاً؟',
  'هل يمكنني رؤية المزيد من الصور؟',
];

interface ContactSellerModalProps {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  sellerId: string;
}

export function ContactSellerModal({
  visible,
  onClose,
  listingId,
  listingTitle,
  sellerId,
}: ContactSellerModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { getOrCreateThread, sendMessage } = useChatStore();

  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = (index: number) => {
    setSelectedTemplate(index);
    setMessage(QUICK_MESSAGES[index]);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      setError('يرجى كتابة رسالة');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const threadId = await getOrCreateThread(listingId, sellerId);
      await sendMessage(threadId, message.trim());

      // Reset and close
      handleClose();

      // Navigate to chat
      router.push(`/chat/${threadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إرسال الرسالة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text variant="h4" center>تواصل مع صاحب الإعلان</Text>
              <Text variant="small" color="secondary" numberOfLines={1} center>
                {listingTitle}
              </Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Quick Messages */}
            <Text variant="body" color="secondary" style={styles.sectionLabel}>
              اختر رسالة سريعة أو اكتب رسالتك:
            </Text>

            <View style={styles.templates}>
              {QUICK_MESSAGES.map((msg, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.templateButton,
                    selectedTemplate === index && styles.templateButtonSelected,
                  ]}
                  onPress={() => handleTemplateSelect(index)}
                  disabled={isSubmitting}
                >
                  <Text
                    variant="body"
                    style={[
                      styles.templateText,
                      selectedTemplate === index && styles.templateTextSelected,
                    ]}
                  >
                    {msg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Message Input */}
            <Text variant="body" weight="medium" style={styles.inputLabel}>
              رسالتك
            </Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                setSelectedTemplate(null);
                setError(null);
              }}
              placeholder="اكتب رسالتك هنا..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
            />

            {error && (
              <Text variant="small" style={styles.errorText}>
                {error}
              </Text>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="outline"
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              onPress={handleSend}
              disabled={isSubmitting || !message.trim()}
              style={styles.sendButton}
              icon={
                isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={18} color="#FFFFFF" />
                )
              }
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      maxHeight: '80%',
    },

    // Header
    header: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      padding: theme.spacing.xs,
      width: 40,
    },
    headerText: {
      flex: 1,
      alignItems: 'center',
    },
    placeholder: {
      width: 40,
    },

    // Body
    body: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    sectionLabel: {
      marginBottom: theme.spacing.md,
      textAlign: theme.isRTL ? 'right' : 'left',
    },

    // Templates
    templates: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    templateButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    templateButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    },
    templateText: {
      color: theme.colors.text,
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    templateTextSelected: {
      color: theme.colors.primary,
    },

    // Input
    inputLabel: {
      marginBottom: theme.spacing.sm,
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    input: {
      minHeight: 120,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.body,
      color: theme.colors.text,
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      textAlign: theme.isRTL ? 'right' : 'left',
    },

    // Actions
    actions: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    cancelButton: {
      flex: 1,
    },
    sendButton: {
      flex: 1,
    },
  });

export default ContactSellerModal;
