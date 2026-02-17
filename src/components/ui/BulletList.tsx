/**
 * BulletList Component
 * Reusable bullet list with automatic RTL support
 */

import React from 'react';
import { View, StyleSheet, I18nManager } from 'react-native';
import { Text, TextColor } from './Text';
import { useTheme } from '../../theme';

// Check if RTL - can be made dynamic with i18n later
const isRTL = I18nManager.isRTL || true; // Force RTL for Arabic app

export interface BulletListProps {
  items: string[];
  bulletColor?: string;
  textColor?: TextColor;
  variant?: 'default' | 'warning';
}

export const BulletList: React.FC<BulletListProps> = ({
  items,
  bulletColor,
  textColor = 'secondary',
  variant = 'default',
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const resolvedBulletColor = bulletColor || theme.colors.primary;

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={[styles.bullet, { color: resolvedBulletColor }]}>•</Text>
          <Text variant="paragraph" color={textColor} style={styles.listText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    list: {
      marginTop: theme.spacing.sm,
    },
    listItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    bullet: {
      marginRight: isRTL ? 0 : theme.spacing.sm,
      marginLeft: isRTL ? theme.spacing.md : 0,
      fontSize: theme.fontSize.lg,
      lineHeight: theme.fontSize.lg * theme.lineHeight.normal,
    },
    listText: {
      flex: 1,
      lineHeight: theme.fontSize.base * theme.lineHeight.normal,
      textAlign: isRTL ? 'right' : 'left',
      paddingLeft: isRTL ? theme.spacing.sm : 0,
      paddingRight: isRTL ? 0 : theme.spacing.sm,
    },
  });

export default BulletList;
