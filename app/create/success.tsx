/**
 * Listing Created Success Screen
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { CheckCircle, Home, Plus } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/slices/Text';
import { useCreateListingStore } from '../../src/stores/createListingStore';

export default function SuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { reset } = useCreateListingStore();

  const handleGoHome = () => {
    reset();
    router.replace('/');
  };

  const handleCreateAnother = () => {
    reset();
    router.replace('/create');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'تم النشر',
          headerShown: true,
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '15' }]}>
            <CheckCircle size={80} color={theme.colors.success} />
          </View>

          {/* Success Message */}
          <Text variant="h1" style={styles.title}>تم نشر إعلانك!</Text>
          <Text variant="paragraph" color="secondary" style={styles.message}>
            تم إرسال إعلانك للمراجعة وسيتم نشره بعد الموافقة عليه
          </Text>

          {/* Status Info */}
          <View
            style={[
              styles.statusCard,
              { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.statusRow}>
              <Text variant="body">قيد المراجعة</Text>
              <Text variant="small" color="secondary">الحالة</Text>
            </View>
            <View style={styles.divider} />
            <Text variant="small" color="secondary" style={styles.statusNote}>
              سيتم إشعارك عند الموافقة على الإعلان أو في حال وجود ملاحظات
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleGoHome}
          >
            <Home size={20} color="#fff" />
            <Text variant="body" color="inverse">العودة للرئيسية</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={handleCreateAnother}
          >
            <Plus size={20} color={theme.colors.text} />
            <Text variant="body">إضافة إعلان آخر</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  statusCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  statusNote: {
    textAlign: 'center',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});
