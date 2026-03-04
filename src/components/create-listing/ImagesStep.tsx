/**
 * Images Step
 * Image and video upload for listing using reusable ImageUploadGrid component
 * - Images: multiple uploads, no size limit (Cloudflare handles optimization)
 * - Video: single upload, 50MB limit, only shown if subscription allows
 * Includes validation error display
 *
 * Uses user's subscription plan for limits:
 * - maxImagesPerListing from subscription
 * - videoAllowed from subscription
 */

import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, Alert, Switch, TouchableOpacity } from 'react-native';
import { ImageIcon, Video, AlertCircle, Info, CarFront } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { ImageUploadGrid, ImageItem } from '../slices/ImageUploadGrid';
import { useCreateListingStore } from '../../stores/createListingStore';
import { useUserAuthStore } from '../../stores/userAuthStore';
import { getCloudflareImageUrl } from '../../utils/cloudflare-images';
import { CarInspection, fromBackendFormat, toBackendFormat, DamageReport } from './CarInspection';

// Default limits (used if subscription not loaded)
const DEFAULT_MAX_IMAGES = 5;
const DEFAULT_VIDEO_ALLOWED = false;

export default function ImagesStep() {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const {
    formData,
    attributes,
    uploadAndAddImage,
    removeImage,
    uploadAndAddVideo,
    removeVideo,
    getValidationError,
    setSpecField,
  } = useCreateListingStore();

  // Get user's subscription limits from their actual package (not public plans)
  const userPackage = useUserAuthStore((state) => state.userPackage);
  const maxImages = userPackage?.userSubscription?.maxImagesPerListing ?? DEFAULT_MAX_IMAGES;
  const videoAllowed = userPackage?.userSubscription?.videoAllowed ?? DEFAULT_VIDEO_ALLOWED;

  // Track pending uploads (images being uploaded, not yet in store)
  const [pendingUploads, setPendingUploads] = useState<Map<string, ImageItem>>(new Map());
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Car damage state
  const [showCarDamage, setShowCarDamage] = useState(false);

  // Check if category has car_damage attribute (only for cars category)
  const hasCarDamageAttribute = useMemo(() => {
    return attributes.some(attr =>
      attr.key === 'car_damage' || attr.key === 'body_damage'
    );
  }, [attributes]);

  // Get current car damage from specs
  const currentCarDamage: DamageReport[] = useMemo(() => {
    const rawValue = formData.specs?.car_damage;
    if (!rawValue) return [];
    return fromBackendFormat(rawValue as string[]);
  }, [formData.specs?.car_damage]);

  // Handle car damage changes
  const handleCarDamageChange = useCallback((damages: DamageReport[]) => {
    const backendFormat = toBackendFormat(damages);
    setSpecField('car_damage', backendFormat.length > 0 ? backendFormat : undefined);
  }, [setSpecField]);

  const imagesValidationError = getValidationError('images');

  // Combine store images with pending uploads for display
  const imageItems: ImageItem[] = useMemo(() => {
    // First, add all uploaded images from store
    // Use 'card' variant (400x300) for grid thumbnails
    const storeImages: ImageItem[] = formData.images.map((img) => ({
      id: img.id,
      uri: getCloudflareImageUrl(img.id, 'card'),
      isUploading: false,
      isUploaded: true,
      cloudflareKey: img.id,
    }));

    // Then add pending uploads (images currently being uploaded)
    const pendingImages = Array.from(pendingUploads.values());

    return [...storeImages, ...pendingImages];
  }, [formData.images, pendingUploads]);

  // Convert form video to ImageItem format for the grid
  const videoItems: ImageItem[] = useMemo(() => {
    return formData.video.map((vid) => ({
      id: vid.id,
      uri: vid.url,
      isVideo: true,
      isUploading: uploadingVideo,
      isUploaded: true,
      cloudflareKey: vid.id,
    }));
  }, [formData.video, uploadingVideo]);

  // Handle image changes from ImageUploadGrid
  const handleImagesChange = useCallback(async (newImages: ImageItem[]) => {
    // Get current total count (store + pending)
    const currentCount = formData.images.length + pendingUploads.size;

    // Get IDs of images that are either in store or pending
    const existingIds = new Set([
      ...formData.images.map(img => img.id),
      ...pendingUploads.keys(),
    ]);

    // Find newly added images (picked from gallery, not yet uploaded)
    let newItems = newImages.filter(img => !existingIds.has(img.id) && !img.isUploaded);

    // Enforce max images limit - only allow adding up to the limit
    const availableSlots = Math.max(0, maxImages - currentCount);
    if (newItems.length > availableSlots) {
      // Trim to available slots and show error
      newItems = newItems.slice(0, availableSlots);
      if (availableSlots === 0) {
        setImageError(`الحد الأقصى هو ${maxImages} صور`);
        Alert.alert('تنبيه', `لقد وصلت للحد الأقصى (${maxImages} صور)`);
        return;
      } else {
        Alert.alert('تنبيه', `تم إضافة ${availableSlots} صور فقط - الحد الأقصى ${maxImages} صور`);
      }
    }

    // Find removed images (in store but not in newImages)
    const newIds = new Set(newImages.map(img => img.id));
    const removedFromStore = formData.images.filter(img => !newIds.has(img.id));

    // Remove deleted images from store (this also deletes from Cloudflare via backend)
    for (const removed of removedFromStore) {
      await removeImage(removed.id);
    }

    // Remove cancelled pending uploads
    const removedPending = Array.from(pendingUploads.keys()).filter(id => !newIds.has(id));
    if (removedPending.length > 0) {
      setPendingUploads(prev => {
        const next = new Map(prev);
        removedPending.forEach(id => next.delete(id));
        return next;
      });
    }

    // Upload new images
    for (const newItem of newItems) {
      if (newItem.uri && newItem.file) {
        // Add to pending uploads immediately (shows with loading state)
        setPendingUploads(prev => new Map(prev).set(newItem.id, {
          ...newItem,
          isUploading: true,
          isUploaded: false,
        }));
        setImageError(null);

        try {
          const assetKey = await uploadAndAddImage(
            newItem.uri,
            undefined,
            (progress) => {
              // Update progress in pending upload
              setPendingUploads(prev => {
                const next = new Map(prev);
                const item = next.get(newItem.id);
                if (item) {
                  next.set(newItem.id, { ...item, uploadProgress: progress });
                }
                return next;
              });
            }
          );

          // Remove from pending uploads (store now has the uploaded image)
          setPendingUploads(prev => {
            const next = new Map(prev);
            next.delete(newItem.id);
            return next;
          });

          if (!assetKey) {
            setImageError('فشل رفع الصورة');
          }
        } catch (error: any) {
          console.error('Image upload error:', error);
          setImageError(error.message || 'فشل رفع الصورة');

          // Remove failed upload from pending
          setPendingUploads(prev => {
            const next = new Map(prev);
            next.delete(newItem.id);
            return next;
          });
        }
      }
    }
  }, [formData.images, pendingUploads, uploadAndAddImage, removeImage]);

  // Handle video changes from ImageUploadGrid
  const handleVideoChange = useCallback(async (newVideos: ImageItem[]) => {
    // If video removed
    if (newVideos.length === 0 && formData.video.length > 0) {
      await removeVideo();
      return;
    }

    // If new video added
    const newVideo = newVideos.find(v => !v.isUploaded && v.uri);
    if (newVideo && newVideo.file) {
      setUploadingVideo(true);
      setVideoError(null);

      try {
        const videoId = await uploadAndAddVideo(
          newVideo.uri,
          (progress) => {
            // Progress callback
          }
        );

        if (!videoId) {
          setVideoError('فشل رفع الفيديو');
        }
      } catch (error: any) {
        console.error('Video upload error:', error);
        setVideoError(error.message || 'فشل رفع الفيديو');
      } finally {
        setUploadingVideo(false);
      }
    }
  }, [formData.video, uploadAndAddVideo, removeVideo]);

  // Handle errors from ImageUploadGrid
  const handleImageError = useCallback((error: string) => {
    setImageError(error);
    Alert.alert('خطأ', error);
  }, []);

  const handleVideoError = useCallback((error: string) => {
    setVideoError(error);
    Alert.alert('خطأ', error);
  }, []);

  return (
    <View style={styles.container}>
      {/* Section: Images */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <ImageIcon size={20} color={theme.colors.primary} />
          </View>
          <Text variant="h3" style={styles.sectionTitle}>صور الإعلان</Text>
        </View>
        <Text variant="paragraph" color="secondary" style={styles.sectionSubtitle}>
          أضف صوراً واضحة لمنتجك (الصورة الأولى ستكون الرئيسية) - {formData.images.length}/{maxImages} صور
        </Text>

        <ImageUploadGrid
          images={imageItems}
          onChange={handleImagesChange}
          maxImages={maxImages}
          accept="image"
          onError={handleImageError}
          emptyStateTitle="أضف صور المنتج"
          emptyStateSubtitle={`اضغط هنا لاختيار الصور من المعرض (الحد الأقصى: ${maxImages} صور)`}
        />

        {/* Image validation error */}
        {(imagesValidationError || imageError) && (
          <View style={styles.errorContainer}>
            <AlertCircle size={14} color={theme.colors.error} />
            <Text variant="small" style={[styles.errorText, { color: theme.colors.error }]}>
              {imagesValidationError || imageError}
            </Text>
          </View>
        )}
      </View>

      {/* Section: Video (only if allowed by subscription) */}
      {videoAllowed && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Video size={20} color={theme.colors.primary} />
            </View>
            <Text variant="h3" style={styles.sectionTitle}>فيديو المنتج</Text>
            <Text variant="small" color="secondary" style={styles.optionalBadge}>
              اختياري
            </Text>
          </View>
          <Text variant="paragraph" color="secondary" style={styles.sectionSubtitle}>
            أضف فيديو قصير لعرض المنتج (دقيقة واحدة كحد أقصى)
          </Text>

          <ImageUploadGrid
            images={videoItems}
            onChange={handleVideoChange}
            maxVideoSizeMB={50}
            accept="video"
            onError={handleVideoError}
            emptyStateTitle="أضف فيديو للمنتج"
            emptyStateSubtitle="فيديو واحد فقط - الحد الأقصى 50 ميجابايت"
          />

          {/* Video error */}
          {videoError && (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={theme.colors.error} />
              <Text variant="small" style={[styles.errorText, { color: theme.colors.error }]}>
                {videoError}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Section: Car Body Inspection (only for cars category) */}
      {hasCarDamageAttribute && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <CarFront size={20} color={theme.colors.primary} />
            </View>
            <Text variant="h3" style={styles.sectionTitle}>فحص الهيكل</Text>
            <Text variant="small" color="secondary" style={styles.optionalBadge}>
              اختياري
            </Text>
          </View>

          {/* Toggle switch */}
          <TouchableOpacity
            style={[styles.toggleRow, { borderColor: theme.colors.border }]}
            onPress={() => {
              const newValue = !showCarDamage;
              setShowCarDamage(newValue);
              // Clear car damage when toggle is off
              if (!newValue && currentCarDamage.length > 0) {
                setSpecField('car_damage', undefined);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.toggleTextContainer}>
              <Text variant="body" style={styles.toggleLabel}>
                هل يوجد ملاحظات على الهيكل؟
              </Text>
              <Text variant="small" color="secondary">
                حدد الأجزاء المدهونة أو المُستبدلة في السيارة
              </Text>
            </View>
            <Switch
              value={showCarDamage || currentCarDamage.length > 0}
              onValueChange={(value) => {
                setShowCarDamage(value);
                if (!value && currentCarDamage.length > 0) {
                  setSpecField('car_damage', undefined);
                }
              }}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryLight,
              }}
              thumbColor={
                (showCarDamage || currentCarDamage.length > 0)
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
          </TouchableOpacity>

          {/* Car Inspection Component */}
          {(showCarDamage || currentCarDamage.length > 0) && (
            <CarInspection
              value={currentCarDamage}
              onChange={handleCarDamageChange}
            />
          )}
        </View>
      )}

      {/* Info note */}
      <View style={[styles.infoNote, { backgroundColor: theme.colors.primaryLight }]}>
        <Info size={20} color={theme.colors.primary} />
        <Text variant="small" color="secondary" style={styles.infoText}>
          تأكد من أن الصور واضحة وتظهر المنتج من زوايا مختلفة لجذب المشترين
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: theme.spacing.lg,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    sectionIconContainer: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionSubtitle: {
      textAlign: isRTL ? 'right' : 'left',
    },
    optionalBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.border,
      borderRadius: theme.radius.sm,
    },
    infoNote: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },
    infoText: {
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    // Error styles
    errorContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      justifyContent: isRTL ? 'flex-end' : 'flex-start',
    },
    errorText: {
      textAlign: isRTL ? 'right' : 'left',
    },
    // Toggle row styles
    toggleRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
    },
    toggleTextContainer: {
      flex: 1,
      gap: theme.spacing.xs,
      marginRight: isRTL ? 0 : theme.spacing.md,
      marginLeft: isRTL ? theme.spacing.md : 0,
    },
    toggleLabel: {
      textAlign: isRTL ? 'right' : 'left',
    },
  });
