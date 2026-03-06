/**
 * PromoBanner Component
 * CTA banner - row on tablet (Image | Content | Button), column on mobile
 * Matches web frontend: components/slices/PromoBanner
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Container, ContainerProps } from './Container';
import { Text } from './Text';
import { Button } from './Button';
import { Image } from './Image';

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
  const styles = useMemo(() => createPromoBannerStyles(theme), [theme]);

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
              <Image src={imageSrc} width="100%" height="100%" resizeMode="contain" transparent />
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
  // Use row/row-reverse based on RTL/LTR so button and image switch positions
  const getTabletFlexDirection = (): 'row' | 'row-reverse' => {
    if (theme.isRTL) {
      // RTL: row = first child on right, row-reverse = first child on left
      return imagePosition === 'left' ? 'row-reverse' : 'row';
    } else {
      // LTR: row = first child on left, row-reverse = first child on right
      return imagePosition === 'left' ? 'row' : 'row-reverse';
    }
  };

  const flexDirection = getTabletFlexDirection();

  return (
    <Container paddingY={paddingY}>
      <View style={[styles.bannerTablet, { backgroundColor: bgColor, flexDirection }]}>
        {/* Image */}
        {imageSrc && (
          <View style={styles.imageWrapperTablet}>
            <Image src={imageSrc} width="100%" height="100%" resizeMode="contain" transparent />
          </View>
        )}

        {/* Content - in middle */}
        <View style={[styles.content, { alignItems: theme.isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text variant="h3" style={theme.rtl.textAlign.start()}>{title}</Text>
          {subtitle && <Text variant="paragraph" color="secondary" style={theme.rtl.textAlign.start()}>{subtitle}</Text>}
        </View>

        {/* Button - separate section */}
        <View style={styles.buttonWrapper}>
          <Button variant="outline" size="md" onPress={onButtonPress} arrow>{buttonText}</Button>
        </View>
      </View>
    </Container>
  );
}

const createPromoBannerStyles = (theme: Theme) =>
  StyleSheet.create({
    // Mobile: column layout
    bannerMobile: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      alignItems: 'center',
      gap: theme.spacing.sm,
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
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      alignItems: 'center',
      gap: theme.spacing.md,
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
      gap: theme.spacing.xs,
    },
    buttonWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default PromoBanner;
