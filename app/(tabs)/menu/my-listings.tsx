/**
 * My Listings Screen
 * Shows user's active listings
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text } from '../../../src/components/ui/Text';

export default function MyListingsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.emptyState}>
        <FileText size={64} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
          لا توجد إعلانات
        </Text>
        <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
          ستظهر إعلاناتك هنا بعد إضافتها
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
