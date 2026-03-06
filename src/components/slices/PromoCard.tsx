/**
 * PromoCard Component
 * Simple promo card - always row layout with image and content
 * Matches web frontend: components/slices/PromoCard
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';
import { Image } from './Image';

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
  const styles = useMemo(() => createPromoCardStyles(theme), [theme]);

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

  // Image component - use transparent for CTA images (AVIF/PNG with transparency)
  const imageComponent = imageSrc && (
    <View style={styles.imageWrapper}>
      <Image src={imageSrc} width="100%" height="100%" resizeMode="contain" transparent />
    </View>
  );

  // Content component
  const contentComponent = (
    <View style={[styles.content, { alignItems: contentAlign }]}>
      <View style={[styles.titleRow, theme.rtl.flexDirection.row()]}>
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

const createPromoCardStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.radius.lg,
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
      padding: theme.spacing.md,
      justifyContent: 'space-between',
      gap: theme.spacing.xs,
    },
    titleRow: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    badge: {
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
    },
  });

export default PromoCard;
