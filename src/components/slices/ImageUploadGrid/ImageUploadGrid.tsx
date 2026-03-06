/**
 * ImageUploadGrid - Reusable image/video upload component
 *
 * Features:
 * - Multiple image upload with preview
 * - Single video upload mode
 * - Upload progress tracking
 * - File size validation (NO size limit for images - Cloudflare handles optimization)
 * - Video size limit with user feedback
 * - RTL support
 * - Reorderable grid (first image = main)
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image as RNImage,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Camera, Plus, X, Play, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useTheme, Theme } from '../../../theme';
import { Text } from '../Text';

export interface ImageItem {
  id: string;
  uri: string;
  file?: {
    uri: string;
    type: string;
    name: string;
    size?: number;
  };
  isVideo?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  isUploaded?: boolean;
  cloudflareKey?: string; // Set after upload to Cloudflare
}

export interface ImageUploadGridProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  minImages?: number; // Minimum required images (prevents deletion below this)
  maxVideoSizeMB?: number; // Only for videos (images have no limit)
  accept?: 'image' | 'video';
  disabled?: boolean;
  onError?: (error: string) => void;
  label?: string;
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
}

export function ImageUploadGrid({
  images,
  onChange,
  maxImages = 10,
  minImages = 0, // Default: no minimum
  maxVideoSizeMB = 50, // 50MB default for videos
  accept = 'image',
  disabled = false,
  onError,
  label,
  emptyStateTitle,
  emptyStateSubtitle,
}: ImageUploadGridProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  const isVideoMode = accept === 'video';
  const maxVideos = isVideoMode ? 1 : maxImages; // Videos always limited to 1

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} كيلوبايت`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  // Request permissions
  const requestPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'صلاحية مطلوبة',
        'نحتاج إلى صلاحية الوصول للمعرض لاختيار الصور',
        [{ text: 'حسناً' }]
      );
      return false;
    }
    return true;
  };

  // Pick media from library
  const handlePickMedia = async () => {
    if (disabled || isPickerLoading) return;

    // Check if we've reached the limit
    if (images.length >= maxVideos) {
      if (isVideoMode) {
        // For video mode, replace the existing video
        handleRemoveImage(images[0].id);
      } else {
        onError?.(`الحد الأقصى هو ${maxImages} صور`);
        return;
      }
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    setIsPickerLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: isVideoMode
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: !isVideoMode && (maxImages - images.length) > 1,
        selectionLimit: isVideoMode ? 1 : maxImages - images.length,
        quality: 0.8,
        videoMaxDuration: 60, // 1 minute max for videos
      });

      if (result.canceled) {
        setIsPickerLoading(false);
        return;
      }

      const newImages: ImageItem[] = [];

      for (const asset of result.assets) {
        // Video size validation (images have no limit)
        if (isVideoMode && asset.fileSize) {
          const maxBytes = maxVideoSizeMB * 1024 * 1024;
          if (asset.fileSize > maxBytes) {
            onError?.(
              `حجم الفيديو كبير جداً (${formatFileSize(asset.fileSize)}). الحد الأقصى: ${maxVideoSizeMB} ميجابايت`
            );
            continue;
          }
        }

        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileType = isVideoMode ? 'video/mp4' : (asset.mimeType || 'image/jpeg');
        const fileName = isVideoMode
          ? `video-${id}.mp4`
          : `image-${id}.${asset.mimeType?.split('/')[1] || 'jpg'}`;

        newImages.push({
          id,
          uri: asset.uri,
          file: {
            uri: asset.uri,
            type: fileType,
            name: fileName,
            size: asset.fileSize,
          },
          isVideo: isVideoMode,
          isUploading: false,
          isUploaded: false,
        });
      }

      if (newImages.length > 0) {
        if (isVideoMode) {
          // Replace existing video
          onChange(newImages);
        } else {
          onChange([...images, ...newImages]);
        }
      }
    } catch (error: any) {
      onError?.('حدث خطأ أثناء اختيار الملف');
    } finally {
      setIsPickerLoading(false);
    }
  };

  // Remove image
  const handleRemoveImage = (id: string) => {
    // Check minimum images requirement
    const uploadedImages = images.filter(img => img.isUploaded || img.cloudflareKey);
    if (minImages > 0 && uploadedImages.length <= minImages) {
      Alert.alert(
        'لا يمكن الحذف',
        `يجب الاحتفاظ بصورة واحدة على الأقل`,
        [{ text: 'حسناً' }]
      );
      return;
    }
    onChange(images.filter(img => img.id !== id));
  };

  // Render single image/video item
  const renderMediaItem = (item: ImageItem, index: number) => {
    const isMain = index === 0 && !isVideoMode;

    return (
      <View key={item.id} style={styles.imageContainer}>
        {/* Media preview */}
        {item.isVideo ? (
          <View style={styles.videoPreview}>
            <Video
              source={{ uri: item.uri }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isMuted
            />
            <View style={styles.videoOverlay}>
              <Play size={32} color={theme.colors.textInverse} fill={theme.colors.textInverse} />
            </View>
          </View>
        ) : (
          // Use RNImage for all images - uri is either local file:// or Cloudflare https://
          <RNImage
            source={{ uri: item.uri }}
            style={styles.media}
            resizeMode="cover"
          />
        )}

        {/* Upload progress overlay */}
        {item.isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.textInverse} />
            {item.uploadProgress !== undefined && (
              <Text variant="small" style={styles.progressText}>
                {Math.round(item.uploadProgress)}%
              </Text>
            )}
          </View>
        )}

        {/* Upload success badge */}
        {item.isUploaded && !item.isUploading && (
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.success }]}>
            <CheckCircle size={14} color={theme.colors.textInverse} />
          </View>
        )}

        {/* Main image badge - centered with outline style */}
        {isMain && !item.isUploading && (
          <View style={[styles.mainBadge, { backgroundColor: theme.colors.bg, borderColor: theme.colors.primary }]}>
            <Text variant="small" style={{ color: theme.colors.primary }}>رئيسية</Text>
          </View>
        )}

        {/* Remove button */}
        {!disabled && !item.isUploading && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
            onPress={() => handleRemoveImage(item.id)}
          >
            <X size={16} color={theme.colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render add button
  const renderAddButton = () => {
    if (images.length >= maxVideos && !isVideoMode) return null;

    return (
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            backgroundColor: theme.colors.bg,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={handlePickMedia}
        disabled={disabled || isPickerLoading}
      >
        {isPickerLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <View style={[styles.addIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Plus size={24} color={theme.colors.primary} />
            </View>
            <Text variant="small" color="secondary">
              {isVideoMode ? 'إضافة فيديو' : 'إضافة صورة'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <TouchableOpacity
      style={[
        styles.emptyState,
        {
          backgroundColor: theme.colors.bg,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={handlePickMedia}
      disabled={disabled || isPickerLoading}
    >
      {isPickerLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Camera size={48} color={theme.colors.primary} />
          </View>
          <Text variant="body" style={styles.emptyTitle}>
            {emptyStateTitle || (isVideoMode ? 'أضف فيديو المنتج' : 'أضف صور المنتج')}
          </Text>
          <Text variant="small" color="secondary" style={styles.emptySubtitle}>
            {emptyStateSubtitle || 'اضغط هنا لاختيار الملفات من المعرض'}
          </Text>
          {isVideoMode ? (
            <Text variant="small" color="secondary">
              الحد الأقصى: فيديو واحد • {maxVideoSizeMB} ميجابايت • دقيقة واحدة
            </Text>
          ) : (
            <Text variant="small" color="secondary">
              الحد الأقصى: {maxImages} صور
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="body" style={styles.label}>{label}</Text>
      )}

      {images.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.grid}>
          {images.map((item, index) => renderMediaItem(item, index))}
          {!isVideoMode && renderAddButton()}
          {isVideoMode && images.length > 0 && (
            <TouchableOpacity
              style={[styles.replaceButton, { borderColor: theme.colors.border }]}
              onPress={handlePickMedia}
              disabled={disabled || isPickerLoading}
            >
              <Text variant="small" color="primary">استبدال الفيديو</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.md,
    },
    label: {
    },
    emptyState: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptyTitle: {
      textAlign: 'center',
    },
    emptySubtitle: {
      textAlign: 'center',
    },
    grid: {
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    imageContainer: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.colors.surface,
    },
    media: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surface,
    },
    videoPreview: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    progressText: {
      color: theme.colors.textInverse,
    },
    statusBadge: {
      position: 'absolute',
      top: theme.spacing.xs,
      left: theme.spacing.xs,
      width: 24,
      height: 24,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mainBadge: {
      position: 'absolute',
      bottom: theme.spacing.sm,
      left: 0,
      right: 0,
      marginHorizontal: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      alignItems: 'center',
    },
    removeButton: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      width: 24,
      height: 24,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButton: {
      width: '31%',
      aspectRatio: 1,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: theme.radius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    addIconContainer: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    replaceButton: {
      width: '100%',
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
  });

export default ImageUploadGrid;
