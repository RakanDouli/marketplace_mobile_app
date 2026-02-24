/**
 * Variant Selection Pre-Step
 * User selects variant after model selection
 * "Other" option allows custom variant entry in the form
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useTheme, Theme } from '../../src/theme';
import { Text, ListItem } from '../../src/components/slices';
import { useCreateListingStore } from '../../src/stores/createListingStore';
import type { Variant } from '../../src/stores/createListingStore/types';

export default function VariantSelectionScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const { variants, formData, setFormField } = useCreateListingStore();

  const handleVariantSelect = (variant: Variant) => {
    // Set variant in form
    setFormField('variantId', variant.id);
    setFormField('variantName', variant.name);

    // Go to wizard
    router.push('/create/wizard');
  };

  const handleOtherSelect = () => {
    // Clear variant - user will type in form
    setFormField('variantId', undefined);
    setFormField('variantName', undefined);

    // Go to wizard (model already selected)
    router.push('/create/wizard');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: formData.modelName ? `إصدارات ${formData.modelName}` : 'اختر الإصدار',
          headerShown: true,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['bottom']}>
        {/* Fixed "Other" option at top */}
        <View style={[styles.otherSection, { backgroundColor: theme.colors.bg, borderBottomColor: theme.colors.border }]}>
          <ListItem
            label="إصدار آخر"
            subtitle="أدخل اسم الإصدار يدوياً"
            icon={
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                <Plus size={24} color={theme.colors.primary} />
              </View>
            }
            onPress={handleOtherSelect}
            showArrow
            showBorder={false}
            size="lg"
          />
        </View>

        {/* Divider */}
        <View style={[styles.sectionDivider, { backgroundColor: theme.colors.surface }]}>
          <Text variant="small" color="secondary">
            أو اختر من القائمة
          </Text>
        </View>

        {/* Variant list */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {variants.length > 0 ? (
            variants.map((variant, index) => (
              <ListItem
                key={variant.id}
                label={variant.name}
                onPress={() => handleVariantSelect(variant)}
                showArrow
                showBorder={index < variants.length - 1}
                selected={formData.variantId === variant.id}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondary">
                لا توجد إصدارات متاحة لهذا الموديل
              </Text>
              <Text variant="small" color="muted" style={{ marginTop: 8 }}>
                اختر "إصدار آخر" لإدخال الاسم يدوياً
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    otherSection: {
      borderBottomWidth: 1,
    },
    sectionDivider: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    scrollView: {
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 16,
    },
  });
