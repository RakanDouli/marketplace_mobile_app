/**
 * Seller Profile Screen
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';

export default function SellerProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const styles = createStyles(theme);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'الملف الشخصي',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Button
              variant="ghost"
              onPress={() => router.back()}
              icon={<ArrowRight size={24} color={theme.colors.text} />}
            />
          ),
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTitleStyle: { fontFamily: theme.fontFamily.header, color: theme.colors.text },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="h3" center>ملف البائع</Text>
          <Text variant="paragraph" center color="secondary">ID: {id}</Text>
          {/* TODO: Implement seller profile */}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
});
