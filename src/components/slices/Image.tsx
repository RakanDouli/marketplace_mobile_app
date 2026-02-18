/**
 * Image Component
 * Handles Cloudflare images with loading skeleton and error states
 * Matches web frontend: marketplace-frontend/components/slices/Image/
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Image as RNImage,
  StyleSheet,
  Animated,
  ViewStyle,
  ImageStyle,
  DimensionValue,
} from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import {
  getCloudflareImageUrl,
  isCloudflareImageId,
  CloudflareVariant,
} from '../../services/cloudflare/images';

export interface ImageProps {
  /** Image source - can be Cloudflare ID, URL, or require() */
  src?: string | number | null;
  /** Cloudflare variant for optimization */
  variant?: CloudflareVariant;
  /** Aspect ratio (e.g., 4/3, 16/9, 1) */
  aspectRatio?: number;
  /** Fixed width */
  width?: DimensionValue;
  /** Fixed height */
  height?: DimensionValue;
  /** Border radius */
  borderRadius?: number;
  /** Container style */
  style?: ViewStyle;
  /** Image resize mode */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /** Alt text for accessibility */
  alt?: string;
}

export function Image({
  src,
  variant = 'card',
  aspectRatio,
  width,
  height,
  borderRadius,
  style,
  resizeMode = 'cover',
  alt,
}: ImageProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // Start with opacity 1 for debugging - images should be visible immediately
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Get optimized image URL
  const imageUrl = useMemo(() => {
    if (!src) return null;

    // Handle require() sources
    if (typeof src === 'number') return src;

    // Handle full URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }

    // Handle Cloudflare IDs
    if (isCloudflareImageId(src)) {
      return getCloudflareImageUrl(src, variant);
    }

    // Assume it's a Cloudflare ID if it looks like one
    return getCloudflareImageUrl(src, variant);
  }, [src, variant]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Build container style
  const containerStyle: ViewStyle = {
    ...styles.container,
    ...(aspectRatio && { aspectRatio }),
    ...(width && { width }),
    ...(height && { height }),
    ...(borderRadius !== undefined && { borderRadius }),
    ...style,
  };

  // Build image style
  const imageStyle: ImageStyle = {
    ...styles.image,
    ...(borderRadius !== undefined && { borderRadius }),
  };

  // No source - show placeholder
  if (!imageUrl) {
    return (
      <View style={[containerStyle, styles.errorContainer]}>
        <ImageOff size={24} color={theme.colors.textMuted} />
      </View>
    );
  }

  // Error state
  if (hasError) {
    return (
      <View style={[containerStyle, styles.errorContainer]}>
        <ImageOff size={24} color={theme.colors.textMuted} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Skeleton loader */}
      {isLoading && (
        <Animated.View style={[styles.skeleton, StyleSheet.absoluteFill]}>
          <View style={styles.shimmer} />
        </Animated.View>
      )}

      {/* Image */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <RNImage
          source={typeof imageUrl === 'number' ? imageUrl : { uri: imageUrl }}
          style={imageStyle}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          accessibilityLabel={alt}
        />
      </Animated.View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    skeleton: {
      backgroundColor: theme.colors.surface,
    },
    shimmer: {
      flex: 1,
      backgroundColor: theme.colors.border,
      opacity: 0.5,
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
  });

export default Image;
