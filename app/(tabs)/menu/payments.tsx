/**
 * Payments Screen
 * Shows payment history and transactions
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text } from '../../../src/components/slices/Text';

export default function PaymentsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.emptyState}>
        <Receipt size={64} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
          لا توجد مدفوعات
        </Text>
        <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
          سجل المدفوعات والمعاملات المالية سيظهر هنا
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
