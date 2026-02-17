/**
 * Messages Tab - Threads List
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/ui/Text';

export default function MessagesScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.bg, borderBottomColor: theme.colors.border }]}>
        <Text variant="h2">الرسائل</Text>
      </View>

      {/* Empty State */}
      <View style={styles.emptyState}>
        <MessageCircle size={64} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>لا توجد رسائل</Text>
        <Text variant="paragraph" color="muted" center style={{ marginTop: 8 }}>
          ستظهر محادثاتك هنا
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Account for tab bar
  },
});
