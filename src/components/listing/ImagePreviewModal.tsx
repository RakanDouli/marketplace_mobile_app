/**
 * ImagePreviewModal Component
 * Full-screen image viewer with zoom and swipe
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
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '../slices';
import { useTheme, Theme } from '../../theme';
import { getCloudflareImageUrl } from '../../services/cloudflare/images';
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

interface ImagePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export function ImagePreviewModal({
  visible,
  onClose,
  images,
  initialIndex = 0,
}: ImagePreviewModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  // Zoom state for current image
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
    if (currentIndex < images.length - 1) {
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

  const renderImage = ({ item, index }: { item: string; index: number }) => {
    const isActive = index === currentIndex;

    return (
      <View style={styles.imageContainer}>
        <GestureHandlerRootView style={styles.gestureContainer}>
          <PinchGestureHandler
            onGestureEvent={isActive ? handlePinch : undefined}
            onHandlerStateChange={isActive ? handlePinchEnd : undefined}
          >
            <Animated.View style={[styles.imageWrapper, isActive && animatedStyle]}>
              <Image
                source={{ uri: getCloudflareImageUrl(item, 'desktop') }}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>
          </PinchGestureHandler>
        </GestureHandlerRootView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text variant="body" style={styles.counter}>
            {currentIndex + 1} / {images.length}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Image Viewer */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={renderImage}
          keyExtractor={(item, index) => `${item}-${index}`}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            {/* Previous button - left side (React Native auto-mirrors for RTL) */}
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={goToPrev}
              >
                <ChevronLeft size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {/* Next button - right side (React Native auto-mirrors for RTL) */}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={goToNext}
              >
                <ChevronRight size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <View style={styles.thumbnails}>
            <FlatList
              data={images}
              horizontal
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
                  <Image
                    source={{ uri: getCloudflareImageUrl(item, 'thumbnail') }}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `thumb-${item}-${index}`}
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
      backgroundColor: '#000000',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingTop: 50, // Account for status bar
      paddingBottom: theme.spacing.md,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    counter: {
      color: '#FFFFFF',
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
      borderRadius: 24,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    thumbnailsContent: {
      paddingHorizontal: theme.spacing.md,
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
      borderColor: '#FFFFFF',
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
  });

export default ImagePreviewModal;
