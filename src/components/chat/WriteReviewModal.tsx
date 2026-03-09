/**
 * WriteReviewModal
 * Modal for writing a review for another user in chat
 * Star rating + positive/negative tag selection
 * Uses BaseModal for consistent styling
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text, Button, BaseModal } from '../slices';
import { useReviewsStore, POSITIVE_REVIEW_TAGS, NEGATIVE_REVIEW_TAGS, CreateReviewInput } from '../../stores/reviewsStore';

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  reviewedUserId: string;
  reviewedUserName: string;
  listingId?: string;
  threadId?: string;
  onSuccess?: () => void;
}

export function WriteReviewModal({
  visible,
  onClose,
  reviewedUserId,
  reviewedUserName,
  listingId,
  threadId,
  onSuccess,
}: WriteReviewModalProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);
  const { createReview, isSubmitting } = useReviewsStore();

  // State
  const [rating, setRating] = useState(0);
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [negativeTags, setNegativeTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ rating?: string; tags?: string }>({});

  // Toggle positive tag
  const togglePositiveTag = (tag: string) => {
    setPositiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setErrors((prev) => ({ ...prev, tags: undefined }));
  };

  // Toggle negative tag
  const toggleNegativeTag = (tag: string) => {
    setNegativeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setErrors((prev) => ({ ...prev, tags: undefined }));
  };

  // Handle submit
  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    // Validation
    const newErrors: { rating?: string; tags?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'يرجى اختيار تقييم بالنجوم';
    }

    if (positiveTags.length === 0 && negativeTags.length === 0) {
      newErrors.tags = 'يرجى اختيار نقطة إيجابية أو سلبية على الأقل';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const input: CreateReviewInput = {
        reviewedUserId,
        listingId,
        threadId,
        rating,
        positiveTags,
        negativeTags,
      };

      await createReview(input);

      Alert.alert('تم إرسال التقييم', 'شكراً لك على تقييمك', [
        { text: 'حسناً', onPress: handleClose },
      ]);

      onSuccess?.();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إرسال التقييم');
    }
  };

  // Handle close and reset
  const handleClose = () => {
    setRating(0);
    setPositiveTags([]);
    setNegativeTags([]);
    setErrors({});
    onClose();
  };

  // Footer with action buttons
  const footer = (
    <View style={styles.actions}>
      <Button
        variant="outline"
        onPress={handleClose}
        disabled={isSubmitting}
        style={styles.actionButton}
      >
        إلغاء
      </Button>
      <Button
        variant="primary"
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.actionButton}
      >
        {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
      </Button>
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title={`تقييم ${reviewedUserName}`}
      maxHeightPercent={90}
      footer={footer}
    >
      {/* Star Rating */}
      <View style={styles.section}>
        <Text variant="body" style={styles.sectionTitle}>
          التقييم بالنجوم
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => {
                setRating(star);
                setErrors((prev) => ({ ...prev, rating: undefined }));
              }}
              style={styles.starButton}
            >
              <Star
                size={40}
                color={star <= rating ? theme.colors.warning : theme.colors.textMuted}
                fill={star <= rating ? theme.colors.warning : 'none'}
              />
            </TouchableOpacity>
          ))}
        </View>
        {errors.rating && (
          <Text variant="small" style={styles.errorText}>
            {errors.rating}
          </Text>
        )}
        {rating > 0 && !errors.rating && (
          <Text variant="small" color="secondary" center>
            {rating} من 5 نجوم
          </Text>
        )}
      </View>

      {/* Positive Tags */}
      <View style={styles.section}>
        <Text variant="body" style={styles.sectionTitle}>
          النقاط الإيجابية
        </Text>
        <View style={styles.tagsContainer}>
          {POSITIVE_REVIEW_TAGS.map((tag) => (
            <TouchableOpacity
              key={`positive-${tag}`}
              onPress={() => togglePositiveTag(tag)}
              style={[
                styles.tag,
                styles.positiveTag,
                positiveTags.includes(tag) && styles.tagSelected,
              ]}
            >
              <Text
                variant="small"
                style={[
                  styles.tagText,
                  positiveTags.includes(tag) && styles.tagTextSelected,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {positiveTags.length > 0 && (
          <Text variant="small" color="secondary">
            تم اختيار {positiveTags.length} نقطة إيجابية
          </Text>
        )}
      </View>

      {/* Negative Tags */}
      <View style={styles.section}>
        <Text variant="body" style={styles.sectionTitle}>
          النقاط السلبية
        </Text>
        <View style={styles.tagsContainer}>
          {NEGATIVE_REVIEW_TAGS.map((tag) => (
            <TouchableOpacity
              key={`negative-${tag}`}
              onPress={() => toggleNegativeTag(tag)}
              style={[
                styles.tag,
                styles.negativeTag,
                negativeTags.includes(tag) && styles.negativeTagSelected,
              ]}
            >
              <Text
                variant="small"
                style={[
                  styles.tagText,
                  negativeTags.includes(tag) && styles.tagTextSelected,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.tags && (
          <Text variant="small" style={styles.errorText}>
            {errors.tags}
          </Text>
        )}
        {negativeTags.length > 0 && !errors.tags && (
          <Text variant="small" color="secondary">
            تم اختيار {negativeTags.length} نقطة سلبية
          </Text>
        )}
      </View>
    </BaseModal>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      marginBottom: theme.spacing.sm,
      fontWeight: '600',
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    starButton: {
      padding: theme.spacing.xs,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    tag: {
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
    },
    positiveTag: {
      borderColor: theme.colors.success,
      backgroundColor: 'transparent',
    },
    negativeTag: {
      borderColor: theme.colors.error,
      backgroundColor: 'transparent',
    },
    tagSelected: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    negativeTagSelected: {
      backgroundColor: theme.colors.error,
      borderColor: theme.colors.error,
    },
    tagText: {
      color: theme.colors.text,
    },
    tagTextSelected: {
      color: theme.colors.textInverse,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
  });
