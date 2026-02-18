/**
 * ShareButton Component
 * Handles sharing listing with proper metadata
 * Uses React Native's Share API
 */

import React from 'react';
import { TouchableOpacity, Share, StyleSheet, Platform } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';

export interface ShareMetadata {
  title: string;
  description?: string;
  url: string;
  price?: string;
  /** Image URL for sharing (full Cloudflare URL) */
  imageUrl?: string;
}

interface ShareButtonProps {
  metadata: ShareMetadata;
  size?: number;
  style?: 'overlay' | 'inline';
}

export function ShareButton({
  metadata,
  size = 16,
  style = 'overlay',
}: ShareButtonProps) {
  const theme = useTheme();
  const styles = createStyles(theme, style);

  const handleShare = async () => {
    try {
      // Ensure all values are strings (defensive coding to prevent [object Object])
      const title = typeof metadata.title === 'string' ? metadata.title : '';
      const description = typeof metadata.description === 'string' ? metadata.description : '';
      const price = typeof metadata.price === 'string' ? metadata.price : '';
      const url = typeof metadata.url === 'string' ? metadata.url : '';

      const message = [
        title,
        description,
        price ? `السعر: ${price}` : null,
        url,
      ].filter(Boolean).join('\n');

      const result = await Share.share(
        Platform.OS === 'ios'
          ? {
              message: message,
              url: url,
            }
          : {
              message: message,
            },
        {
          dialogTitle: 'مشاركة الإعلان',
          subject: title || 'شام باي',
        }
      );

      if (result.action === Share.sharedAction) {
        // Shared successfully
        console.log('[Share] Shared successfully');
      }
    } catch (error) {
      console.error('[Share] Error sharing:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <Share2 size={size} color={theme.colors.text} />
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme, style: 'overlay' | 'inline') =>
  StyleSheet.create({
    button: style === 'overlay' ? {
      width: theme.iconSize.lg,
      height: theme.iconSize.lg,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    } : {
      padding: theme.spacing.sm,
    },
  });

export default ShareButton;
