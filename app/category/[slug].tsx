/**
 * Category Listings Screen
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/ui/Text';

export default function CategoryListingsScreen() {
  const theme = useTheme();
  const { slug, name } = useLocalSearchParams<{ slug: string; name?: string }>();

  const styles = createStyles(theme);

  return (
    <>
      <Stack.Screen
        options={{
          title: name || slug || 'الإعلانات',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="h3" center>{name || slug}</Text>
          <Text variant="paragraph" center color="secondary">قائمة الإعلانات</Text>
          {/* TODO: Implement category listings grid */}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
});
