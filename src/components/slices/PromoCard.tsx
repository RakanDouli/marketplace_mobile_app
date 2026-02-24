/**
 * PromoCard Component
 * Simple promo card - always row layout with image and content
 * Matches web frontend: components/slices/PromoCard
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';

export type PromoCardVariant = 'primary' | 'secondary' | 'accent' | 'neutral';
export type ImagePosition = 'left' | 'right';

export interface PromoCardProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  onButtonPress: () => void;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: ImagePosition;
  badge?: string;
  variant?: PromoCardVariant;
}

export function PromoCard({
  title,
  subtitle,
  buttonText,
  onButtonPress,
  imageSrc,
  imagePosition = 'left',
  badge,
  variant = 'primary',
}: PromoCardProps) {
  const theme = useTheme();

  const variantColors: Record<PromoCardVariant, string> = {
    primary: theme.colors.infoLight,
    secondary: theme.colors.warningLight,
    accent: theme.colors.accentBg,
    neutral: theme.colors.surface,
  };

  const bgColor = variantColors[variant];

  // Content text alignment - align to opposite side of image for visual balance
  // When image is LEFT, text aligns to END (right in LTR)
  // When image is RIGHT, text aligns to START (left in LTR)
  const contentAlign = imagePosition === 'left' ? 'flex-end' : 'flex-start';

  // Image component
  const imageComponent = imageSrc && (
    <View style={styles.imageWrapper}>
      <Image source={imageSrc} style={styles.image} contentFit="contain" />
    </View>
  );

  // Content component
  const contentComponent = (
    <View style={[styles.content, { alignItems: contentAlign }]}>
      <View style={[styles.titleRow, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
            <Text variant="xs" color="inverse">{badge}</Text>
          </View>
        )}
        <Text variant="body">{title}</Text>
      </View>
      {subtitle && <Text variant="small" color="secondary">{subtitle}</Text>}
      <Button variant="outline" size="sm" onPress={onButtonPress} arrow>{buttonText}</Button>
    </View>
  );

  // Simple logic: use flexDirection based on imagePosition
  // 'row' = image (first child) on LEFT
  // 'row-reverse' = image (first child) on RIGHT
  const cardFlexDirection: 'row' | 'row-reverse' = imagePosition === 'left' ? 'row' : 'row-reverse';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor, flexDirection: cardFlexDirection }]}
      onPress={onButtonPress}
      activeOpacity={0.9}
    >
      {imageComponent}
      {contentComponent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '30%',
    maxWidth: 120,
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    gap: 4,
  },
  titleRow: {
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
});

export default PromoCard;
