/**
 * EditListingModal Component
 * Quick edit modal for published listings
 * Allows editing: title, description, price, bidding settings, status
 *
 * For drafts/rejected listings, use the "Continue" button which
 * navigates to the create listing wizard with loadDraft
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Save, AlertTriangle } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { Input } from '../slices/Input';
import { Button } from '../slices/Button';
import { PriceInput } from '../slices/PriceInput';
import { ToggleField } from '../slices/ToggleField';
import { useUserListingsStore, UserListing } from '../../stores/userListingsStore';
import { LISTING_STATUS_LABELS, REJECTION_REASON_LABELS, getLabel } from '../../constants/metadata-labels';

export interface EditListingModalProps {
  visible: boolean;
  onClose: () => void;
  listing: UserListing;
  onSuccess?: () => void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  visible,
  onClose,
  listing,
  onSuccess,
}) => {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const { updateMyListing, loadMyListingById, isLoading } = useUserListingsStore();

  // Form state
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description || '');
  const [priceMinor, setPriceMinor] = useState(listing.priceMinor);
  const [allowBidding, setAllowBidding] = useState(listing.allowBidding || false);
  const [biddingStartPrice, setBiddingStartPrice] = useState(listing.biddingStartPrice || 0);
  const [isHidden, setIsHidden] = useState(listing.status === 'HIDDEN');

  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if listing is rejected
  const isRejected = listing.status === 'REJECTED';
  const rejectionMessage = listing.rejectionMessage ||
    (listing.rejectionReason ? getLabel(listing.rejectionReason, REJECTION_REASON_LABELS) : null);

  // Reset form when listing changes
  useEffect(() => {
    if (visible) {
      setTitle(listing.title);
      setDescription(listing.description || '');
      setPriceMinor(listing.priceMinor);
      setAllowBidding(listing.allowBidding || false);
      setBiddingStartPrice(listing.biddingStartPrice || 0);
      setIsHidden(listing.status === 'HIDDEN');
      setError(null);
    }
  }, [listing, visible]);

  // Validate form
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('العنوان مطلوب');
      return false;
    }
    if (title.length < 10) {
      setError('العنوان يجب أن يكون 10 أحرف على الأقل');
      return false;
    }
    if (priceMinor <= 0) {
      setError('السعر يجب أن يكون أكبر من صفر');
      return false;
    }
    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      // Determine new status
      let newStatus = listing.status;
      if (listing.status === 'ACTIVE' && isHidden) {
        newStatus = 'HIDDEN';
      } else if (listing.status === 'HIDDEN' && !isHidden) {
        newStatus = 'ACTIVE';
      } else if (isRejected) {
        // Re-submit rejected listing for approval
        newStatus = 'PENDING_APPROVAL';
      }

      await updateMyListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        priceMinor,
        allowBidding,
        biddingStartPrice: allowBidding ? biddingStartPrice : null,
        status: newStatus,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if form has changes
  const hasChanges = useMemo(() => {
    return (
      title !== listing.title ||
      description !== (listing.description || '') ||
      priceMinor !== listing.priceMinor ||
      allowBidding !== (listing.allowBidding || false) ||
      biddingStartPrice !== (listing.biddingStartPrice || 0) ||
      isHidden !== (listing.status === 'HIDDEN')
    );
  }, [title, description, priceMinor, allowBidding, biddingStartPrice, isHidden, listing]);

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'تغييرات غير محفوظة',
        'هل تريد تجاهل التغييرات؟',
        [
          { text: 'متابعة التعديل', style: 'cancel' },
          { text: 'تجاهل', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h3" style={styles.headerTitle}>تعديل الإعلان</Text>
          <View style={styles.closeButtonPlaceholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Rejection Alert */}
          {isRejected && rejectionMessage && (
            <View style={styles.rejectionAlert}>
              <View style={styles.rejectionHeader}>
                <AlertTriangle size={20} color={theme.colors.error} />
                <Text variant="paragraph" weight="semibold" style={{ color: theme.colors.error }}>
                  تم رفض الإعلان
                </Text>
              </View>
              <Text variant="small" color="secondary" style={styles.rejectionMessage}>
                {rejectionMessage}
              </Text>
              <Text variant="xs" color="muted" style={styles.rejectionHint}>
                قم بتعديل الإعلان ثم اضغط حفظ لإعادة إرساله للمراجعة
              </Text>
            </View>
          )}

          {/* Category Info */}
          <View style={styles.infoCard}>
            <Text variant="small" color="secondary">
              الفئة: {listing.category?.nameAr || listing.category?.name || 'غير محدد'}
            </Text>
            <Text variant="xs" color="muted">
              الحالة: {getLabel(listing.status, LISTING_STATUS_LABELS)}
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text variant="small" color="error">{error}</Text>
            </View>
          )}

          {/* Title */}
          <Input
            label="عنوان الإعلان"
            placeholder="أدخل عنوان الإعلان"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            showCounter
            required
          />

          {/* Description */}
          <Input
            label="الوصف"
            placeholder="أدخل وصف تفصيلي للإعلان"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            maxLength={2000}
            showCounter
          />

          {/* Price */}
          <PriceInput
            label="السعر"
            value={priceMinor}
            onChange={setPriceMinor}
            required
          />

          {/* Bidding Toggle */}
          <ToggleField
            label="السماح بالمزايدة"
            value={allowBidding}
            onChange={setAllowBidding}
            description="تمكين المزايدة يسمح للمشترين بتقديم عروض أسعار"
          />

          {/* Bidding Start Price */}
          {allowBidding && (
            <PriceInput
              label="سعر بداية المزايدة"
              value={biddingStartPrice}
              onChange={setBiddingStartPrice}
            />
          )}

          {/* Status Toggle (only for ACTIVE/HIDDEN) */}
          {(listing.status === 'ACTIVE' || listing.status === 'HIDDEN') && (
            <ToggleField
              label="إيقاف الإعلان مؤقتاً"
              value={isHidden}
              onChange={setIsHidden}
              description={isHidden
                ? 'الإعلان مخفي حالياً ولن يظهر في البحث'
                : 'الإعلان ظاهر ويمكن للآخرين رؤيته'
              }
            />
          )}

          {/* Info note for full editing */}
          <View style={styles.noteCard}>
            <Text variant="small" color="secondary">
              لتعديل الصور أو المواصفات التفصيلية، يرجى إنشاء إعلان جديد أو التواصل مع الدعم الفني.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleClose}
            style={styles.footerButton}
            disabled={isSaving}
          >
            إلغاء
          </Button>
          <Button
            variant="primary"
            onPress={handleSave}
            style={styles.footerButton}
            loading={isSaving}
            disabled={isSaving || !hasChanges}
            icon={<Save size={18} color="#fff" />}
          >
            حفظ التغييرات
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    closeButtonPlaceholder: {
      width: 40,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    rejectionAlert: {
      backgroundColor: '#fef2f2',
      borderWidth: 1,
      borderColor: theme.colors.error,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    rejectionHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    rejectionMessage: {
      marginBottom: theme.spacing.xs,
    },
    rejectionHint: {
      fontStyle: 'italic',
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    errorContainer: {
      backgroundColor: '#fef2f2',
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    noteCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    footer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    footerButton: {
      flex: 1,
    },
  });

export default EditListingModal;
