/**
 * ImagePreviewModal Component
 * Full-screen media viewer with zoom and swipe
 * Supports both images and video
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react-native';
import { Text } from './Text';
import { useTheme, Theme } from '../../theme';
import { getCloudflareImageUrl, getResponsiveImageUrl } from '../../utils/cloudflare-images';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Media item type for unified handling
export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  id: string;
}

export interface ImagePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  /** @deprecated Use mediaItems instead */
  images?: string[];
  /** Media items (images and video) */
  mediaItems?: MediaItem[];
  initialIndex?: number;
}

// Video player component for preview modal
const VideoPreviewItem: React.FC<{ url: string; isActive: boolean }> = ({ url, isActive }) => {
  const theme = useTheme();
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    // Auto-play when this item becomes active
    if (isActive) {
      p.play();
    }
  });

  // Pause/play based on active state
  React.useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <View style={{
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT - 200,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <VideoView
        player={player}
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_WIDTH * (9 / 16), // 16:9 aspect ratio
        }}
        nativeControls={true}
        contentFit="contain"
        allowsFullscreen={true}
      />
    </View>
  );
};

export function ImagePreviewModal({
  visible,
  onClose,
  images,
  mediaItems,
  initialIndex = 0,
}: ImagePreviewModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  // Convert legacy images prop to mediaItems format
  const items: MediaItem[] = React.useMemo(() => {
    if (mediaItems && mediaItems.length > 0) {
      return mediaItems;
    }
    // Fallback to legacy images prop (these are Cloudflare image keys)
    if (images && images.length > 0) {
      return images.map((imageKey) => ({
        type: 'image' as const,
        url: imageKey,  // Keep original key for URL generation
        id: imageKey,   // Use the image key as ID for getResponsiveImageUrl
      }));
    }
    return [];
  }, [mediaItems, images]);

  // Zoom state for current image (only for images, not video)
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);

  const handlePinch = (event: PinchGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      scale.value = baseScale.value * event.nativeEvent.scale;
    }
  };

  const handlePinchEnd = (event: PinchGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        baseScale.value = 1;
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
        baseScale.value = 3;
      } else {
        baseScale.value = scale.value;
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const goToNext = () => {
    if (currentIndex < items.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      resetZoom();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      resetZoom();
    }
  };

  const resetZoom = () => {
    scale.value = withSpring(1);
    baseScale.value = 1;
  };

  const handleScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      resetZoom();
    }
  };

  const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => {
    const isActive = index === currentIndex;

    // Render video
    if (item.type === 'video') {
      return (
        <View style={styles.imageContainer}>
          <VideoPreviewItem url={item.url} isActive={isActive} />
        </View>
      );
    }

    // Render image with pinch-to-zoom
    return (
      <View style={styles.imageContainer}>
        <GestureHandlerRootView style={styles.gestureContainer}>
          <PinchGestureHandler
            onGestureEvent={isActive ? handlePinch : undefined}
            onHandlerStateChange={isActive ? handlePinchEnd : undefined}
          >
            <Animated.View style={[styles.imageWrapper, isActive && animatedStyle]}>
              <Image
                source={{ uri: getResponsiveImageUrl(item.id, SCREEN_WIDTH, 'preview') }}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>
          </PinchGestureHandler>
        </GestureHandlerRootView>
      </View>
    );
  };

  // Get current item type for conditional rendering
  const currentItem = items[currentIndex];
  const isCurrentVideo = currentItem?.type === 'video';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.textInverse === '#f8fafc' ? '#0f172a' : '#000000'} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.textInverse} />
          </TouchableOpacity>
          <View style={styles.counterContainer}>
            {isCurrentVideo && (
              <View style={styles.videoBadge}>
                <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            )}
            <Text variant="body" style={styles.counter}>
              {currentIndex + 1} / {items.length}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Media Viewer */}
        <FlatList
          ref={flatListRef}
          data={items}
          horizontal
          inverted={theme.isRTL}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={renderMediaItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
        />

        {/* Navigation Arrows - RTL style (right arrow = prev, left arrow = next) */}
        {items.length > 1 && (
          <>
            {/* Next button - left side */}
            {currentIndex < items.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={goToNext}
              >
                <ChevronLeft size={32} color={theme.colors.textInverse} />
              </TouchableOpacity>
            )}
            {/* Previous button - right side */}
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={goToPrev}
              >
                <ChevronRight size={32} color={theme.colors.textInverse} />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Thumbnails - RTL: start from right */}
        {items.length > 1 && (
          <View style={styles.thumbnails}>
            <FlatList
              data={items}
              horizontal
              inverted={theme.isRTL}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsContent}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCurrentIndex(index);
                    flatListRef.current?.scrollToIndex({ index, animated: true });
                    resetZoom();
                  }}
                  style={[
                    styles.thumbnail,
                    index === currentIndex && styles.thumbnailActive,
                  ]}
                >
                  {item.type === 'video' ? (
                    <View style={styles.videoThumbnail}>
                      <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: getCloudflareImageUrl(item.id, 'small') }}
                      style={styles.thumbnailImage}
                    />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `thumb-${item.id}-${index}`}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.textInverse === '#f8fafc' ? '#0f172a' : '#000000',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingTop: 50, // Account for status bar
      paddingBottom: theme.spacing.md,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: theme.colors.overlay,
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    counterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    counter: {
      color: theme.colors.textInverse,
    },
    videoBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      padding: 4,
    },
    placeholder: {
      width: 40,
    },

    // Image
    imageContainer: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gestureContainer: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageWrapper: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT - 200, // Leave space for header and thumbnails
    },
    image: {
      width: '100%',
      height: '100%',
    },

    // Navigation
    navButton: {
      position: 'absolute',
      top: '50%',
      marginTop: -24,
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navButtonLeft: {
      left: theme.spacing.md,
    },
    navButtonRight: {
      right: theme.spacing.md,
    },

    // Thumbnails
    thumbnails: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: theme.spacing.md,
      paddingBottom: 40, // Safe area
      backgroundColor: theme.colors.overlay,
    },
    thumbnailsContent: {
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    thumbnail: {
      width: 60,
      height: 60,
      borderRadius: theme.radius.sm,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    thumbnailActive: {
      borderColor: theme.colors.textInverse,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    videoThumbnail: {
      width: '100%',
      height: '100%',
      backgroundColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default ImagePreviewModal;
