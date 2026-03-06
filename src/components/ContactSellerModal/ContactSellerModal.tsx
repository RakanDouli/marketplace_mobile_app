/**
 * Contact Seller Modal
 * Modal for sending first message to seller with quick templates
 * Uses BaseModal for consistent styling
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, Theme } from '../../theme';
import { Text, Button, BaseModal } from '../slices';
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
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

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

  // Footer with action buttons
  const footer = (
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
            <ActivityIndicator size="small" color={theme.colors.textInverse} />
          ) : (
            <Send size={18} color={theme.colors.textInverse} />
          )
        }
      >
        {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
      </Button>
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title="تواصل مع صاحب الإعلان"
      subtitle={listingTitle}
      footer={footer}
    >
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
    </BaseModal>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    // Section label
    sectionLabel: {
      marginBottom: theme.spacing.md,
      textAlign: isRTL ? 'right' : 'left',
    },

    // Templates
    templates: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    templateButton: {
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
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
      textAlign: isRTL ? 'right' : 'left',
    },
    templateTextSelected: {
      color: theme.colors.primary,
    },

    // Input
    inputLabel: {
      marginBottom: theme.spacing.sm,
      textAlign: isRTL ? 'right' : 'left',
    },
    input: {
      minHeight: 120,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.body,
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      textAlign: isRTL ? 'right' : 'left',
    },

    // Actions (footer)
    actions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
