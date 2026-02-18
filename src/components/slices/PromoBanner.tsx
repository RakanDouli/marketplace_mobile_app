/**
 * PromoBanner Component
 * CTA banner - row on tablet (Image | Content | Button), column on mobile
 * Matches web frontend: components/slices/PromoBanner
 */

import React from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme';
import { Container, ContainerProps } from './Container';
import { Text } from './Text';
import { Button } from './Button';

export type BannerVariant = 'primary' | 'secondary' | 'accent';
export type ImagePosition = 'left' | 'right';

export interface PromoBannerProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  onButtonPress: () => void;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: ImagePosition;
  variant?: BannerVariant;
  paddingY?: ContainerProps['paddingY'];
}

export function PromoBanner({
  title,
  subtitle,
  buttonText,
  onButtonPress,
  imageSrc,
  imagePosition = 'right',
  variant = 'secondary',
  paddingY = 'sm',
}: PromoBannerProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const isMobile = width < 600;

  const variantColors: Record<BannerVariant, string> = {
    primary: theme.colors.infoLight,
    secondary: theme.colors.warningLight,
    accent: theme.colors.accentBg,
  };

  const bgColor = variantColors[variant];

  if (isMobile) {
    // Mobile: column layout, centered (matches web)
    return (
      <Container paddingY={paddingY}>
        <View style={[styles.bannerMobile, { backgroundColor: bgColor }]}>
          {imageSrc && (
            <View style={styles.imageWrapperMobile}>
              <Image source={imageSrc} style={styles.imageMobile} contentFit="contain" />
            </View>
          )}
          <Text variant="h4" center>{title}</Text>
          {subtitle && <Text variant="small" center color="secondary">{subtitle}</Text>}
          <Button variant="outline" size="sm" onPress={onButtonPress} arrow>{buttonText}</Button>
        </View>
      </Container>
    );
  }

  // Tablet: row layout [Image | Content | Button] or reversed
  // Web uses: imageLeft = row-reverse, imageRight = row
  // In RTL React Native: imageLeft = row-reverse, imageRight = row (same logic)
  const flexDirection = imagePosition === 'left' ? 'row-reverse' : 'row';

  return (
    <Container paddingY={paddingY}>
      <View style={[styles.bannerTablet, { backgroundColor: bgColor, flexDirection }]}>
        {/* Image */}
        {imageSrc && (
          <View style={styles.imageWrapperTablet}>
            <Image source={imageSrc} style={styles.imageTablet} contentFit="contain" />
          </View>
        )}

        {/* Content - in middle */}
        <View style={styles.content}>
          <Text variant="h3">{title}</Text>
          {subtitle && <Text variant="paragraph" color="secondary">{subtitle}</Text>}
        </View>

        {/* Button - separate section */}
        <View style={styles.buttonWrapper}>
          <Button variant="outline" size="md" onPress={onButtonPress} arrow>{buttonText}</Button>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  // Mobile: column layout
  bannerMobile: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  imageWrapperMobile: {
    width: '40%',
    maxWidth: 150,
    aspectRatio: 2,
  },
  imageMobile: {
    width: '100%',
    height: '100%',
  },

  // Tablet: row layout [Image | Content | Button]
  bannerTablet: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  imageWrapperTablet: {
    width: '20%',
    maxWidth: 180,
    aspectRatio: 2,
  },
  imageTablet: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  buttonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PromoBanner;
