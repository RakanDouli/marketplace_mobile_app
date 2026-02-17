/**
 * Blocked Users Screen
 * Shows list of blocked users
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ban } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text } from '../../../src/components/ui/Text';

export default function BlockedUsersScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.emptyState}>
        <Ban size={64} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
          لا يوجد مستخدمون محظورون
        </Text>
        <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
          المستخدمون الذين تقوم بحظرهم سيظهرون هنا
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
