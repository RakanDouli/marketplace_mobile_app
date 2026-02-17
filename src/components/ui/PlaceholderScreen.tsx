/**
 * Placeholder Screen Component
 * Temporary component for screens under development
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface PlaceholderScreenProps {
  title: string;
  description?: string;
}

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description && (
          <Text style={styles.description}>
            {description}
          </Text>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            قيد التطوير
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    title: {
      fontSize: theme.fontSize['2xl'],
      fontWeight: theme.fontWeight.bold,
      fontFamily: theme.fontFamily.header,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontSize: theme.fontSize.base,
      fontFamily: theme.fontFamily.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    badge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.warningLight,
    },
    badgeText: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
      fontFamily: theme.fontFamily.bodyMedium,
      color: theme.colors.warning,
    },
  });

export default PlaceholderScreen;
