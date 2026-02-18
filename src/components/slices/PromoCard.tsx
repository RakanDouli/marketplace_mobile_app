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

  // RTL: row = first child on right, row-reverse = first child on left
  // imageLeft: Image on left → use 'row-reverse' (first child goes left)
  // imageRight: Image on right → use 'row' (first child goes right)
  const flexDirection = imagePosition === 'left' ? 'row-reverse' : 'row';

  // Content aligns towards where it sits:
  // imageLeft → content on right → align right → flex-start in RTL
  // imageRight → content on left → align left → flex-end in RTL
  const contentAlign = imagePosition === 'left' ? 'flex-start' : 'flex-end';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor, flexDirection }]}
      onPress={onButtonPress}
      activeOpacity={0.9}
    >
      {/* Image */}
      {imageSrc && (
        <View style={styles.imageWrapper}>
          <Image source={imageSrc} style={styles.image} contentFit="contain" />
        </View>
      )}

      {/* Content */}
      <View style={[styles.content, { alignItems: contentAlign }]}>
        <View style={styles.titleRow}>
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
    justifyContent: 'center',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
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
