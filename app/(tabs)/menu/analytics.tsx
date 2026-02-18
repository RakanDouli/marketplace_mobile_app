/**
 * Analytics Screen
 * Shows listing statistics and analytics
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text } from '../../../src/components/slices/Text';

export default function AnalyticsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.emptyState}>
        <BarChart3 size={64} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
          لا توجد إحصائيات
        </Text>
        <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
          قم بنشر إعلانات لعرض الإحصائيات والتحليلات
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
