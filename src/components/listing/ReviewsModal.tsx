/**
 * ReviewsModal Component
 * Shows user reviews with rating distribution and tags
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
} from 'react-native';
import { X, Star, User, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { Text, Loading } from '../slices';
import { useTheme, Theme } from '../../theme';
import {
  useReviewsStore,
  POSITIVE_TAGS,
  NEGATIVE_TAGS,
} from '../../stores/reviewsStore';
import { getCloudflareImageUrl } from '../../services/cloudflare/images';

interface ReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

export function ReviewsModal({
  visible,
  onClose,
  userId,
  userName,
}: ReviewsModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const {
    reviews,
    isLoading,
    fetchReviews,
    getRatingDistribution,
    getTagCounts,
    getAverageRating,
  } = useReviewsStore();

  useEffect(() => {
    if (visible && userId) {
      fetchReviews(userId);
    }
  }, [visible, userId]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render stars
  const renderStars = (rating: number, size = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          color={theme.colors.warning}
          fill={i <= rating ? theme.colors.warning : 'transparent'}
        />
      );
    }
    return stars;
  };

  // Render rating bar
  const renderRatingBar = (ratingNum: number, count: number, total: number) => {
    const safeCount = typeof count === 'number' ? count : 0;
    const percentage = total > 0 ? (safeCount / total) * 100 : 0;

    return (
      <View key={ratingNum} style={styles.ratingBar}>
        <View style={styles.ratingBarLabelContainer}>
          <Text variant="xs" style={styles.ratingBarLabel}>{ratingNum}</Text>
          <Star size={10} color={theme.colors.warning} fill={theme.colors.warning} />
        </View>
        <View style={styles.ratingBarTrack}>
          <View
            style={[styles.ratingBarFill, { width: `${percentage}%` }]}
          />
        </View>
        <Text variant="xs" color="muted" style={styles.ratingBarCount}>
          {safeCount}
        </Text>
      </View>
    );
  };

  const distribution = getRatingDistribution();
  const tagCounts = getTagCounts();
  const averageRating = getAverageRating();
  const totalReviews = reviews.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text variant="h4" style={styles.title}>
                  تقييمات {userName || 'البائع'}
                </Text>
                <View style={styles.placeholder} />
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Loading type="svg" size="md" />
                </View>
              ) : reviews.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Star size={48} color={theme.colors.border} />
                  <Text variant="h4" color="secondary" style={styles.emptyText}>
                    لا توجد تقييمات بعد
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                  {/* Rating Overview - Vertical Layout */}
                  <View style={styles.overview}>
                    {/* Average Rating & Stars - Top */}
                    <View style={styles.ratingTop}>
                      <Text variant="h1" style={styles.averageRating}>
                        {averageRating.toFixed(1)}
                      </Text>
                      <View style={styles.starsRow}>
                        {renderStars(Math.round(averageRating), 20)}
                      </View>
                      <Text variant="small" color="secondary">
                        {totalReviews} تقييم
                      </Text>
                    </View>

                    {/* Rating Distribution Bars - Below */}
                    <View style={styles.ratingBars}>
                      {[5, 4, 3, 2, 1].map((rating) =>
                        renderRatingBar(rating, distribution[rating] || 0, totalReviews)
                      )}
                    </View>
                  </View>

                  {/* Tag Summary */}
                  {(Object.keys(tagCounts.positive).length > 0 ||
                    Object.keys(tagCounts.negative).length > 0) && (
                    <View style={styles.tagSummary}>
                      {/* Positive Tags */}
                      {Object.keys(tagCounts.positive).length > 0 && (
                        <View style={styles.tagSection}>
                          <View style={styles.tagHeader}>
                            <ThumbsUp size={14} color={theme.colors.success} />
                            <Text variant="small" bold style={{ color: theme.colors.success }}>
                              إيجابي
                            </Text>
                          </View>
                          <View style={styles.tags}>
                            {Object.entries(tagCounts.positive)
                              .sort(([, a], [, b]) => b - a)
                              .map(([tag, count]) => (
                                <View key={tag} style={styles.tagPositive}>
                                  <Text variant="xs" style={{ color: theme.colors.success }}>
                                    {POSITIVE_TAGS[tag] || tag} ({count})
                                  </Text>
                                </View>
                              ))}
                          </View>
                        </View>
                      )}

                      {/* Negative Tags */}
                      {Object.keys(tagCounts.negative).length > 0 && (
                        <View style={styles.tagSection}>
                          <View style={styles.tagHeader}>
                            <ThumbsDown size={14} color={theme.colors.error} />
                            <Text variant="small" bold style={{ color: theme.colors.error }}>
                              سلبي
                            </Text>
                          </View>
                          <View style={styles.tags}>
                            {Object.entries(tagCounts.negative)
                              .sort(([, a], [, b]) => b - a)
                              .map(([tag, count]) => (
                                <View key={tag} style={styles.tagNegative}>
                                  <Text variant="xs" style={{ color: theme.colors.error }}>
                                    {NEGATIVE_TAGS[tag] || tag} ({count})
                                  </Text>
                                </View>
                              ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Reviews List */}
                  <View style={styles.reviewsList}>
                    <Text variant="body" bold style={styles.reviewsTitle}>
                      جميع التقييمات
                    </Text>
                    {reviews.map((review) => (
                      <View key={review.id} style={styles.reviewItem}>
                        {/* Reviewer */}
                        <View style={styles.reviewerRow}>
                          {review.reviewerAvatar ? (
                            <Image
                              source={{
                                uri: getCloudflareImageUrl(review.reviewerAvatar, 'thumbnail'),
                              }}
                              style={styles.reviewerAvatar}
                            />
                          ) : (
                            <View style={styles.reviewerAvatarPlaceholder}>
                              <User size={16} color={theme.colors.textMuted} />
                            </View>
                          )}
                          <View style={styles.reviewerInfo}>
                            <Text variant="small" bold>
                              {review.reviewerName || 'مستخدم'}
                            </Text>
                            <Text variant="xs" color="muted">
                              {formatDate(review.createdAt)}
                            </Text>
                          </View>
                          <View style={styles.reviewRating}>
                            {renderStars(review.rating, 12)}
                          </View>
                        </View>

                        {/* Tags */}
                        {((review.positiveTags && review.positiveTags.length > 0) ||
                          (review.negativeTags && review.negativeTags.length > 0)) && (
                          <View style={styles.reviewTags}>
                            {review.positiveTags?.map((tag) => (
                              <View key={tag} style={styles.reviewTagPositive}>
                                <ThumbsUp size={10} color={theme.colors.success} />
                                <Text variant="xs" style={{ color: theme.colors.success }}>
                                  {POSITIVE_TAGS[tag] || tag}
                                </Text>
                              </View>
                            ))}
                            {review.negativeTags?.map((tag) => (
                              <View key={tag} style={styles.reviewTagNegative}>
                                <ThumbsDown size={10} color={theme.colors.error} />
                                <Text variant="xs" style={{ color: theme.colors.error }}>
                                  {NEGATIVE_TAGS[tag] || tag}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
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
    closeButton: {
      padding: theme.spacing.xs,
    },
    title: {
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 32,
    },

    // Loading
    loadingContainer: {
      padding: theme.spacing.xl * 2,
      alignItems: 'center',
    },

    // Empty
    emptyContainer: {
      padding: theme.spacing.xl * 2,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    emptyText: {
      textAlign: 'center',
    },

    // Content
    content: {
      padding: theme.spacing.md,
    },

    // Overview - Vertical Layout
    overview: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    ratingTop: {
      alignItems: 'center',
      paddingBottom: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    averageRating: {
      fontSize: 48,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    starsRow: {
      flexDirection: 'row',
      marginVertical: theme.spacing.xs,
      gap: 2,
    },
    ratingBars: {
      gap: theme.spacing.sm,
    },

    // Rating Bar
    ratingBar: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    ratingBarLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      width: 28,
    },
    ratingBarLabel: {
      textAlign: 'center',
    },
    ratingBarTrack: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    ratingBarFill: {
      height: '100%',
      backgroundColor: theme.colors.warning,
      borderRadius: 4,
    },
    ratingBarCount: {
      width: 24,
      textAlign: 'left',
    },

    // Tag Summary
    tagSummary: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    tagSection: {
      gap: theme.spacing.sm,
    },
    tagHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    tags: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    tagPositive: {
      flexDirection: 'row',
      backgroundColor: '#E8F5E9', // Light green
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.full,
    },
    tagNegative: {
      flexDirection: 'row',
      backgroundColor: '#FFEBEE', // Light red
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.full,
    },

    // Reviews List
    reviewsList: {
      marginBottom: theme.spacing.xl,
    },
    reviewsTitle: {
      textAlign: 'right',
      marginBottom: theme.spacing.md,
    },
    reviewItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    reviewerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    reviewerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    reviewerAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewerInfo: {
      flex: 1,
      alignItems: 'flex-end',
    },
    reviewRating: {
      flexDirection: 'row',
    },
    reviewTags: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
    },
    reviewTagPositive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#E8F5E9', // Light green
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.full,
    },
    reviewTagNegative: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FFEBEE', // Light red
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.full,
    },
  });

export default ReviewsModal;
