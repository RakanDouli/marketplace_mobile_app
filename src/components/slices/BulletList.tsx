/**
 * BulletList Component
 * Reusable bullet list with automatic RTL support via I18nManager
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextColor } from './Text';
import { useTheme } from '../../theme';

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
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      flexDirection: 'row', // Auto-flips to row-reverse in RTL
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    bullet: {
      marginEnd: theme.spacing.sm, // RTL-safe
      fontSize: theme.fontSize.lg,
      lineHeight: theme.fontSize.lg * theme.lineHeight.normal,
    },
    listText: {
      flex: 1,
      lineHeight: theme.fontSize.base * theme.lineHeight.normal,
      textAlign: 'left', // Auto-becomes right in RTL
      paddingStart: theme.spacing.sm, // RTL-safe
    },
  });

export default BulletList;
