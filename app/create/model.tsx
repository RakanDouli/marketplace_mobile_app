/**
 * Model Selection Pre-Step
 * User selects model after brand selection
 * Shows variants grouped under models if available
 * "Other" option allows custom model entry in the form
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useTheme, Theme } from '../../src/theme';
import { Text, ListItem } from '../../src/components/slices';
import { useCreateListingStore } from '../../src/stores/createListingStore';
import type { Model, Variant } from '../../src/stores/createListingStore/types';

interface ModelGroup {
  model: Model;
  variants: Variant[];
}

export default function ModelSelectionScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const {
    models,
    variants,
    isLoadingModels,
    attributes,
    formData,
    setFormField,
    fetchVariants,
  } = useCreateListingStore();

  // Check if category has variants
  const hasVariants = attributes.some(attr => attr.key === 'variantId');

  // Group variants by model
  const modelGroups = useMemo((): ModelGroup[] => {
    return models.map(model => ({
      model,
      variants: variants.filter(v => v.modelId === model.id),
    }));
  }, [models, variants]);

  const handleModelSelect = async (model: Model) => {
    // Set model in form
    setFormField('modelId', model.id);
    setFormField('modelName', model.name);
    setFormField('isOtherModel', false);

    // Clear variant
    setFormField('variantId', undefined);
    setFormField('variantName', undefined);

    // Fetch variants for this model
    await fetchVariants(model.id);

    // Check if model has variants after fetching
    const store = useCreateListingStore.getState();
    if (hasVariants && store.variants.length > 0) {
      // Go to variant selection
      router.push('/create/variant');
    } else {
      // No variants, go to wizard
      router.push('/create/wizard');
    }
  };

  const handleVariantSelect = (model: Model, variant: Variant) => {
    // Set model and variant
    setFormField('modelId', model.id);
    setFormField('modelName', model.name);
    setFormField('variantId', variant.id);
    setFormField('variantName', variant.name);
    setFormField('isOtherModel', false);

    // Go to wizard
    router.push('/create/wizard');
  };

  const handleOtherSelect = () => {
    // Clear model/variant - user will type in form
    setFormField('modelId', undefined);
    setFormField('modelName', undefined);
    setFormField('variantId', undefined);
    setFormField('variantName', undefined);
    setFormField('isOtherModel', true);

    // Go to wizard
    router.push('/create/wizard');
  };

  if (isLoadingModels) {
    return (
      <>
        <Stack.Screen options={{ title: 'اختر الموديل', headerShown: true }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            جاري تحميل الموديلات...
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: formData.brandName ? `موديلات ${formData.brandName}` : 'اختر الموديل',
          headerShown: true,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['bottom']}>
        {/* Fixed "Other" option at top */}
        <View style={[styles.otherSection, { backgroundColor: theme.colors.bg, borderBottomColor: theme.colors.border }]}>
          <ListItem
            label="موديل آخر"
            subtitle="أدخل اسم الموديل يدوياً"
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

        {/* Model list */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {models.length > 0 ? (
            hasVariants ? (
              // Show models with inline variants
              modelGroups.map((group, groupIndex) => (
                <View key={group.model.id}>
                  {group.variants.length > 0 ? (
                    <>
                      {/* Model header with variants */}
                      <View style={[styles.modelHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                        <Text variant="h4" style={{ textAlign: 'right' }}>
                          {group.model.name}
                        </Text>
                      </View>
                      {/* Variants list */}
                      {group.variants.map((variant, variantIndex) => (
                        <ListItem
                          key={variant.id}
                          label={variant.name}
                          onPress={() => handleVariantSelect(group.model, variant)}
                          showArrow
                          showBorder={variantIndex < group.variants.length - 1}
                        />
                      ))}
                    </>
                  ) : (
                    // Model without variants - selectable
                    <ListItem
                      label={group.model.name}
                      onPress={() => handleModelSelect(group.model)}
                      showArrow
                      showBorder={groupIndex < modelGroups.length - 1}
                    />
                  )}
                </View>
              ))
            ) : (
              // Flat list of models
              models.map((model, index) => (
                <ListItem
                  key={model.id}
                  label={model.name}
                  onPress={() => handleModelSelect(model)}
                  showArrow
                  showBorder={index < models.length - 1}
                />
              ))
            )
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondary">
                لا توجد موديلات متاحة لهذه الماركة
              </Text>
              <Text variant="small" color="muted" style={{ marginTop: 8 }}>
                اختر "موديل آخر" لإدخال الاسم يدوياً
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
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
    modelHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 16,
    },
  });
